
var _ = require('underscore');
var util = require("../../substance/util");
var LensConverter = require('../../converter');
var LensArticle = require("../../article");
var MathNodeTypes = require("./nodes");

// Options:
//   - see Lens.Converter options
//   - 'equationLabelSide': 'left' | 'right' (default: 'left')
var MathConverter = function(options) {
  LensConverter.call(this, options);

  this.options.equationLabelSide = this.options.equationLabelSide || 'left';
};

MathConverter.Prototype = function MathConverterPrototype() {

  var __super__ = LensConverter.prototype;

  this._refTypeMapping["disp-formula"] = "formula_reference";
  this._refTypeMapping["statement"] = "math_environment_reference";

  this.acceptedParagraphElements = _.extend(__super__.acceptedParagraphElements, {
    "def-list": { handler: 'defList' }
  });

  this._annotationTypes = _.extend(__super__._annotationTypes, {
    "roman": "custom_annotation"
  });

  this.test = function(xmlDoc, documentUrl) {
    /* jshint unused:false */
    var publisherName = xmlDoc.querySelector("publisher-name").textContent;
    return publisherName === "American Mathematical Society";
  };

  this.createState = function(xmlDoc, doc) {
    var state = __super__.createState.call(this, xmlDoc, doc);

    // Note: This overrides the eLife behavior introducing an extra level for 'Main Text' (et al)
    state.sectionLevel = 0;

    // instead of adding nodes to the content panel instantly
    // we defer this to be able to decide whether a node should be shown in flow or not
    state.shownNodes = [];
    // to store display related information (such as environment should go into math panel)
    state.nodeInfo = {};

    // Data structures to store relationships between environments, formulas and labels.
    // Later these are used to create 'deep' linking formula references.
    state.envStack = [];
    state.environments = {};
    state.formulas = {};
    state.labels = {};
    state.formulaForLabel = {};
    state.labelsForFormula = {};
    state.envForFormula = {};

    return state;
  };

  // For the time of development the math nodes are implemented within this project
  // and we create an Lens.Article which supports these new node types
  this.createDocument = function() {
    var doc = new LensArticle({
      nodeTypes: (this.options.nodeTypes || MathNodeTypes)
    });
    // initialize a container for the math environments
    doc.create({
      type: 'view',
      id: 'math',
      nodes: []
    });
    return doc;
  };


  // TODO: the default implemenation should be plain, i.e. not adding an extra heading 'Main Text'
  // Instead the LensConverter should override this...
  // ...or we should consider adding an option (if the eLife way to do it is more often applicable...)
  this.body = function(state, body) {
    var nodes = this.bodyNodes(state, util.dom.getChildren(body));
    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  this._bodyNodes["statement"] = function(state, statement) {
    var contentType = statement.getAttribute('content-type');
    // HACK: workaround as atm there are proofs that still use @disp-level
    if (!contentType) {
      contentType = statement.getAttribute('disp-level');
      console.error('FIXME: statement element using @disp-level instead of @content-type');
    }
    // Math environments: thmdefinition, thmplain, thmremark
    if (contentType === "theorem") {
      return this.mathEnvironment(state, statement);
    }
    // Proofs
    else if (contentType === "proof") {
      return this.proof(state, statement);
    } else {
      console.log("Unsupported statement element", contentType);
    }
  };

  this._bodyNodes['def-list'] = this.defList = function(state, defList) {
    var enumerationNode = {
      type: 'enumeration',
      id: state.nextId('enumeration'),
      items: []
    };
    var defItems = this.selectDirectChildren(defList, 'def-item');
    for (var i = 0; i < defItems.length; i++) {
      var defItem = defItems[i];
      var term = defItem.querySelector('term');
      var termId = term.id;
      var def = defItem.querySelector('def');
      var enumItemNode = {
        type: 'enumeration-item',
        // TODO: enabling the correct id makes warnings disappear
        // which are given when seeing references to this def
        // However, to work properly, we would need nesting support
        // for definition references
        // so we leave it for now
        // id: termId || state.nextId('enumeration-item'),
        id: state.nextId('enumeration-item'),
        children: []
      };
      // convert label
      enumItemNode.label = this.annotatedText(state, term, [enumItemNode.id, 'label']);
      // convert content
      // TODO: is the assumption correct that def-item content is always wrapped in a p element?
      var pEls = this.selectDirectChildren(def, 'p');
      for (var j = 0; j < pEls.length; j++) {
        var p = pEls[j];
        var children = this.paragraphGroup(state, p);
        var pgroup = {
          type: 'paragraph',
          id: state.nextId('pgroup'),
          children: _.pluck(children, 'id')
        };
        state.doc.create(pgroup);
        enumItemNode.children.push(pgroup.id);
      }
      state.doc.create(enumItemNode);
      enumerationNode.items.push(enumItemNode.id);
    }
    state.doc.create(enumerationNode);
    return enumerationNode;
  };

  // HACK: There is content that has nested <app> elements, which is not allowed
  // we just treat them as sections
  this._bodyNodes['app'] = this._bodyNodes['sec'];

  this.extractDefinitions = function(/*state, article*/) {
    // We don't want to show a definitions (glossary) panel
    // TODO: we should consider making this a static configuration for lens-converter
    return;
  };

  this.proof = function(state, proofEl) {
    var doc = state.doc;
    // Assuming that there are no nested <boxed-text> elements
    var childNodes = this.bodyNodes(state, util.dom.getChildren(proofEl), {
      ignore: ["title"]
    });
    var titleEl = proofEl.querySelector('title');
    var label = titleEl ? titleEl.textContent : 'Proof';
    var id = state.nextId("proof");
    var proofNode = {
      "type": "proof",
      "id": id,
      "source_id": proofEl.getAttribute("id"),
      "label": label,
      "children": _.pluck(childNodes, 'id')
    };
    doc.create(proofNode);
    return proofNode;
  };

  this.mathEnvironment = function(state, secNode) {
    var doc = state.doc;
    // fetch the math environment content:
    // type
    // title -> can contain math and citations
    // body -> 1+ paragraphs
    // rid -> reference id
    var envType = secNode.getAttribute('style');
    var specificUse = secNode.getAttribute('specific-use');
    var id = state.nextId('math_environment');
    var rId = secNode.getAttribute('id') || id;

    // bookkeeping to be able to associate formulas to environments
    state.envStack.push(id);

    // TODO: are there better semantic representations?
    // I have seen 'statement' as a dedicated element for environments...
    var labelEl = secNode.querySelector('label');
    var titleEl = secNode.querySelector('title');
    var bodyNodes = this.bodyNodes(state, util.dom.getChildren(secNode), {
      ignore: ["label", "title"]
    });

    var mathEnv = {
      id: id,
      type: "math_environment",
      source_id: rId,
      envType: envType,
      body: _.pluck(bodyNodes, 'id')
    };
    var info = {
      specificUse: specificUse
    };

    if (labelEl) {
      mathEnv.label = this.annotatedText(state, labelEl, [mathEnv.id, 'label']);
    }
    if (titleEl) {
      mathEnv.comment = this.annotatedText(state, titleEl, [mathEnv.id, 'comment']);
    }

    if (!labelEl && !titleEl) {
      console.error('There are cases without label and without title!');
    }

    mathEnv = doc.create(mathEnv);
    mathEnv.specificUse = specificUse;

    // keep track of the math environment for formula references
    state.environments[id] = mathEnv;
    state.nodeInfo[id] = info;

    state.envStack.pop();

    return mathEnv;
  };

  this._bodyNodes["disp-formula"] = function(state, child) {
    var formulaNode = this.formula(state, child);

    // Add a label for display formulas not part of an environment
    if (!state.envForFormula[formulaNode.id]) {
      var labels = state.labelsForFormula[formulaNode.id];
      var labelIds = labels ? Object.keys(labels) : [];
      if (labelIds.length > 0) {
        var labelTitles = [];
        _.each(labels, function(label) {
          if (label.title) {
            labelTitles.push(label.title);
          }
        });
        formulaNode.label = [
          labelTitles.length > 1 ? "Equations" : "Equation",
          labelTitles.join('')
        ].join(" ");
      }
    }
    return formulaNode;
  };

  this.addAnnotationDataForXref = function(state, anno, el) {
    __super__.addAnnotationDataForXref.apply(this, arguments, el);
    // for formula_references convert the annotation target into an array
    if (anno.type === 'formula_reference') {
      anno.target = [ anno.target ];
    }
  };

  // Formula Node Type
  // --------

  // <mml:mrow xmlns:xlink="http://www.w3.org/1999/xlink" xlink:type="resource" xlink:label="derivata.elbert"/
  this._extractLabels = function(el) {
    var result = {};
    var xlinkResources = el.querySelectorAll('[*|type="resource"]');
    for (var i = 0; i < xlinkResources.length; i++) {
      var res = xlinkResources[i];
      var label = res.getAttribute('xlink:label');
      var role = res.getAttribute('xlink:role');
      var title = res.getAttribute('xlink:title') || "";
      if (label) {
        result[label] = {
          id: label,
          role: role,
          el: res,
          title: title
        };
      }
    }
    return result;
  };

  this._extractLabelsFromMathJaxTex = function(tex) {
    var result = {};
    var re = /cssId\{([^}]+)\}/g;
    var match;
    var label;
    while ( (match = re.exec(tex)) ) {
      label = match[1];
      result[label] = {
        id: label,
        role: 'equation',
        title: ""
      };
    }
    return result;
  };

  this._getFormulaData = function(state, formulaElement, formulaId, inline) {
    var result = [];
    var labels = {'tex' : {}, 'svg': {}, 'html': {}, 'math': {}};
    var el = formulaElement;
    var alternatives = el.querySelector('alternatives');
    if (alternatives) el = alternatives;
    for (var child = el.firstElementChild; child; child = child.nextElementSibling) {
      var type = util.dom.getNodeType(child);
      switch (type) {
        case "graphic":
        case "inline-graphic":
          result.push({
            format: 'image',
            data: child.getAttribute('xlink:href')
          });
          break;
        case "svg":
          labels.svg = this._extractLabels(child);
          result.push({
            format: "svg",
            data: this.toHtml(child)
          });
          break;
        case "textual-form":
          labels.html = this._extractLabels(child);
          result.push({
            format: "html",
            data: $(child).text()
          });
          break;
        case "mml:math":
        case "math":
          // HACK: make sure that mml in display-formulas has set display="block"
          // Although this should be present in proper MathML it does not really hurt to enforce it here
          if (!inline) {
            child.setAttribute("display", "block");
          }
          // override label alignment (default: left)
          var mtable = child.querySelector('mtable');
          if (mtable) {
            mtable.setAttribute('side', this.options.equationLabelSide);
          }
          var mml = this.mmlToHtmlString(child);
          labels.math = this._extractLabels(child);
          result.push({
            format: "mathml",
            data: mml
          });
          break;
        case "tex-math":
          result.push({
            format: "latex",
            data: child.textContent
          });
          labels.tex = this._extractLabelsFromMathJaxTex(child.textContent);
          break;
        case "label":
          // Skipping - is handled in this.formula()
          var label = child.textContent;
          labels[label] = { id: label, el: child };
          break;
        default:
          console.error('Unsupported formula element of type ' + type);
      }
    }
    // console.log("Extracted labels for formula", formulaId, labels);
    // do some bookkeeping to be able to look up formulas via label (for formula_references)
    labels = _.extend(labels.tex, labels.svg, labels.math);
    _.extend(state.labels, labels);
    _.each(labels, function(l) {
      state.formulaForLabel[l.id] = formulaId;
    });
    state.labelsForFormula[formulaId] = labels;
    return result;
  };

  this.formula = function(state, formulaElement, inline) {
    var doc = state.doc;
    var id = state.nextId("formula");
    var formulaNode = {
      id: id,
      source_id: formulaElement.getAttribute("id"),
      type: "formula",
      label: "",
      inline: !!inline,
      data: [],
      format: [],
    };
    var info = {
      specificUse: formulaElement.getAttribute('specific-use')
    };

    // TODO: there could be multiple labels
    var label = formulaElement.querySelector("label");
    if (label) {
      formulaNode.label = label.textContent;
    }
    var formulaData = this._getFormulaData(state, formulaElement, id, inline);
    for (var i = 0; i < formulaData.length; i++) {
      formulaNode.format.push(formulaData[i].format);
      formulaNode.data.push(formulaData[i].data);
    }
    doc.create(formulaNode);

    // do some bookkeeping to be able to look up environments via formula (for formula_references)
    state.formulas[id] = formulaNode;
    if (state.envStack.length > 0) {
      var envId = _.last(state.envStack);
      state.envForFormula[id] = envId;
    }
    state.nodeInfo[id] = info;

    return formulaNode;
  };

  var _defaultXmlToHtmlMapping = {
    'ext-link': function(el) {
      return [
        '<a class="ext-link" href="', el.getAttribute('xlink:href'), '" target="_blank">',
          '<i class="fa fa-external-link"></i> ',
          el.textContent,
        "</a>"
      ].join('');
    },
    'inline-formula': function(el) {
      return [
        '<span class="inline-formula">',
          '<span class="MathJax_Preview">',
            el.textContent,
          '</span>',
          '<script type="math/tex">',
            el.textContent,
          '</script>',
        '</span>'
      ].join('');
    }
  };

  this.convertXmlToHtml = function(element, mapping) {
    mapping = _.extend({}, _defaultXmlToHtmlMapping, mapping);
    var str = [];
    function _convert(element) {
      var tagName = element.tagName.toLowerCase();
      if (_.isFunction(mapping[tagName])) {
        var elContent = mapping[tagName](element);
        str.push(elContent);
      } else {
        var elType = 'span' || mapping[tagName];
        str.push('<' + elType + ' class="' + tagName + '">');
        for (var childNode = element.firstChild; childNode; childNode = childNode.nextSibling) {
          if (childNode.nodeType === Document.TEXT_NODE) {
            str.push(childNode.textContent);
          } else if (childNode.nodeType === Document.ELEMENT_NODE) {
            _convert(childNode);
          } else {
            console.error("Unsupported node type.", childNode.nodeType);
          }
        }
        str.push('</'+ elType + '>');
      }
    }
    _convert(element);
    return str.join('');
  };

  this.ref = function(state, ref) {
    var citation = ref.querySelector("mixed-citation");
    var rawCitations = ref.querySelectorAll("raw-citation");

    var rawFormats = [];
    _.each(rawCitations, function(rawCitation) {
      var type = rawCitation.getAttribute('type');
      var content = rawCitation.textContent;
      rawFormats.push({
        type: type,
        content: content
      });
    });

    var i;
    var id = state.nextId("plain_citation");
    var citationNode = {
      "id": id,
      "source_id": ref.getAttribute("id"),
      "type": "plain_citation",
      "label": "",
      "authors": [],
      "raw_formats": rawFormats,
      "content": "",
    };

    var label = ref.querySelector("label");
    if(label) citationNode.label = label.textContent;

    var personGroups = citation.querySelectorAll("person-group");
    for (var j = 0; j < personGroups.length; j++) {
      var personGroup = personGroups[j];
      var nameElements = personGroup.querySelectorAll("name");
      for (i = 0; i < nameElements.length; i++) {
        citationNode.authors.push(this.getName(nameElements[i]));
      }
      // Consider collab elements (treat them as authors)
      var collabElements = personGroup.querySelectorAll("collab");
      for (i = 0; i < collabElements.length; i++) {
        citationNode.authors.push(collabElements[i].textContent);
      }
    }

    citationNode.label += " " + citationNode.authors.join(", ");
    citationNode.label = citationNode.label.trim();

    // Don't treat the content at all, just make it simple HTML/CSS
    citationNode.content = this.annotatedText(state, citation, [citationNode.id, "content"]);

    state.doc.create(citationNode);
    state.doc.show("citations", id);
  };


  this.affiliation = function(state, aff) {
    var doc = state.doc;

    var label = aff.querySelector("label");

    var institutionText = '';
    for (var el = aff.firstChild; el; el = el.nextSibling) {
      var type = util.dom.getNodeType(el);
      if (type === 'label' || !el.textContent) continue;
      institutionText += el.textContent;
    }
    var specific_use = aff.getAttribute('specific-use');

    // TODO: we might add a property to the affiliation node that collects
    // data which is not handled here

    var affiliationNode = {
      id: state.nextId("affiliation"),
      type: "affiliation",
      source_id: aff.getAttribute("id"),
      label: label ? label.textContent : null,
      institution: institutionText,
      specific_use: specific_use || null
    };

    state.affiliations.push(affiliationNode.id);
    doc.create(affiliationNode);
  };

  this.extractAuthorImpactStatement = function(state, article) {
    /* jshint unused:false */
    console.error('FIXME: the default implementation is not useful and needs to be replaced.');
    return [];
  };

  // Configuration
  // -------------------

  var MATH_PANEL = 'math';

  this.enhancePublicationInfo = function(state) {
    var article = state.xmlDoc.querySelector("article");
    var articleMeta = article.querySelector("article-meta");

    var publicationInfo = state.doc.get('publication_info');

    // Extract keywords
    // ------------
    //
    // <kwd-group kwd-group-type="author-keywords">
    //  <title>Author keywords</title>
    //  <kwd>innate immunity</kwd>
    //  <kwd>histones</kwd>
    //  <kwd>lipid droplet</kwd>
    //  <kwd>anti-bacterial</kwd>
    // </kwd-group>
    var keyWords = articleMeta.querySelectorAll("kwd-group kwd");

    // Extract subjects
    // ------------
    //
    // <subj-group subj-group-type="heading">
    // <subject>Immunology</subject>
    // </subj-group>
    // <subj-group subj-group-type="heading">
    // <subject>Microbiology and infectious disease</subject>
    // </subj-group>

    var subjects = articleMeta.querySelectorAll("subj-group[subj-group-type=heading] subject");

    // Article Type
    //
    // <subj-group subj-group-type="display-channel">
    //   <subject>Research article</subject>
    // </subj-group>

    var articleType = articleMeta.querySelector("subj-group[subj-group-type=display-channel] subject");

    // Extract PDF link
    // ---------------
    //
    // <self-uri content-type="pdf" xlink:href="elife00007.pdf"/>

    var pdfURI = article.querySelector("self-uri[content-type=pdf]");

    var links = [];

    if (pdfURI) {
      links.push({
        url: pdfURI.getAttribute("xlink:href"),
        name: "PDF",
        type: "pdf"
      });
    }

    // Extract raw citation formats for the article
    // ---------------
    //

    var rawCitations = articleMeta.querySelectorAll("article-citation");

    var rawFormats = [];
    _.each(rawCitations, function(rawCitation) {
      var type = rawCitation.getAttribute('type');
      var content = rawCitation.textContent;
      rawFormats.push({
        type: type,
        content: content
      });
    });

    publicationInfo.raw_formats = rawFormats;

    publicationInfo.keywords = _.pluck(keyWords, "textContent");
    publicationInfo.subjects = _.pluck(subjects, "textContent");
    publicationInfo.article_type = articleType ? articleType.textContent : "";
    publicationInfo.links = links;
  };

  // Overidden, as we want to show nodes in-flow ('content') depending on whether they have been
  // referenced or not. This information is available after postProcessAnnotations().
  // Instead of showing nodes right away we keep them for post-processing.
  this.show = function(state, nodes) {
    if (nodes && nodes.length > 0) {
      state.shownNodes = state.shownNodes.concat(nodes);
    }
  };

  this.postProcess = function(state) {
    // we can now set proper annotation targets, as the addressed nodes
    // now exist
    this.resolveAnnotationTargets(state);
    // now anything is available to decide which nodes are shown where
    // Note: we have overridden LensConverter.show(state, nodes)
    //   so that it stores the ids in the order of occurrence
    //   and here we actually put them into the according panel
    this.populatePanels(state);
  };

  function _getMathReferenceInfo(state, refId) {
    var envId = null;
    var formulaId = null;
    var labelId = null;
    if (state.labels[refId]) {
      labelId = refId;
      formulaId = state.formulaForLabel[labelId];
      envId = state.envForFormula[formulaId];
    } else if (state.formulas[refId]) {
      formulaId = refId;
      envId = state.envForFormula[formulaId];
    } else {
      console.error("Could not resolve target for formula reference", refId);
    }
    return {
      envId: envId,
      formulaId: formulaId,
      labelId: labelId
    };
  }

  // Post-processing, such as creating annotations
  // as at this moment all information is available (e.g. referenced nodes exist)
  this.resolveAnnotationTargets = function(state) {
    var doc = state.doc;
    var targetNode;
    var referencedMath = {};
    for (var i = 0; i < state.annotations.length; i++) {
      var anno = state.annotations[i];
      if (anno.target) {
        if (anno.type === "formula_reference") {
          var refTarget = _getMathReferenceInfo(state, anno.target[0]);
          if (refTarget.formulaId) {
            var newTarget = [];
            if (refTarget.envId) newTarget.push(refTarget.envId);
            if (refTarget.formulaId) newTarget.push(refTarget.formulaId);
            if (refTarget.labelId) newTarget.push(refTarget.labelId);
            anno.target = newTarget;
          }
          if (refTarget.envId) {
            referencedMath[refTarget.envId] = true;
          } else if (refTarget.formulaId) {
            referencedMath[refTarget.formulaId] = true;
          }
        } else if (anno.type === "math_environment_reference") {
          targetNode = state.doc.getNodeBySourceId(anno.target) || state.doc.get(anno.target);
          if (targetNode) {
            anno.target = targetNode.id;
          } else {
            console.log("Could not lookup math environment for reference", anno);
            continue;
          }
          referencedMath[targetNode.id] = true;
        } else {
          targetNode = state.doc.getNodeBySourceId(anno.target) || state.doc.get(anno.target);
          if (targetNode) {
            anno.target = targetNode.id;
          } else {
            console.log("Could not lookup targetNode for annotation", anno);
            continue;
          }
        }
      }
      doc.create(anno);
    }
    _.each(referencedMath, function(val, id) {
      var mathNode = doc.get(id);
      if (!mathNode) {
        console.warn('Referenced math node does not exist:', id);
      } else {
        mathNode.isReferenced = true;
      }
    });
    state.referencedMath = referencedMath;
  };

  this.populatePanels = function(state) {
    var doc = state.doc;
    var referencedMath = state.referencedMath;
    var node, child, info;
    for (var i = 0; i < state.shownNodes.length; i++) {
      node = state.shownNodes[i];
      switch (node.type) {
        case 'figure':
          // show figures without captions are only in-flow
          if (!node.caption) {
            state.doc.show('content', node.id);
          }
          // all others are shown in the figures panel
          else {
            state.doc.show('figures', node.id);
            // in addition a figure can be shown in-flow using position='anchor'
            if (node.position === 'anchor') {
              state.doc.show('content', node.id);
            }
          }
          break;
        case 'formula':
        case 'math_environment':
          info = state.nodeInfo[node.id];
          // only environments or formulas go into the math panel
          // that ar referenced or forced using `specific-use='resource'`
          if (referencedMath[node.id] ||
              (info && info.specificUse === "resource")) {
            doc.show(MATH_PANEL, node.id);
          }
          doc.show('content', node.id);
          break;
        // Special treatment for proofs as they may contain equations
        // which when referenced should be displayed in the resource panel
        case 'proof':
          LensConverter.prototype.showNode.call(this, state, node);
          for (var j = 0; j < node.children.length; j++) {
            child = doc.get(node.children[j]);
            if (child.type === 'formula' || child.type === 'math_environment') {
              info = state.nodeInfo[child.id];
              if (referencedMath[child.id] ||
                (info && info.specificUse === "resource")) {
                doc.show(MATH_PANEL, child.id);
              }
            }
          }
          break;
        default:
          LensConverter.prototype.showNode.call(this, state, node);
      }
    }
  };

};

MathConverter.Prototype.prototype = LensConverter.prototype;
MathConverter.prototype = new MathConverter.Prototype();

module.exports = MathConverter;
