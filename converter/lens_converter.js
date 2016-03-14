"use strict";

var _ = require("underscore");
var util = require("../substance/util");
var errors = util.errors;
var ImporterError = errors.define("ImporterError");
var Article = require("../article");

var NlmToLensConverter = function(options) {
  this.options = options || NlmToLensConverter.DefaultOptions;
};

NlmToLensConverter.Prototype = function() {

  this._annotationTypes = {
    "bold": "strong",
    "italic": "emphasis",
    "monospace": "code",
    "sub": "subscript",
    "sup": "superscript",
    "sc": "custom_annotation",
    "roman": "custom_annotation",
    "sans-serif": "custom_annotation",
    "styled-content": "custom_annotation",
    "underline": "underline",
    "ext-link": "link",
    "xref": "",
    "email": "link",
    "named-content": "",
    "inline-formula": "inline-formula",
    "uri": "link"
  };

  // mapping from xref.refType to node type
  this._refTypeMapping = {
    "bibr": "citation_reference",
    "fig": "figure_reference",
    "table": "figure_reference",
    "supplementary-material": "figure_reference",
    "other": "figure_reference",
    "list": "definition_reference",
  };

  // mapping of contrib type to human readable names
  // Can be overriden in specialized converter
  this._contribTypeMapping = {
    "author": "Author",
    "author non-byline": "Author",
    "autahor": "Author",
    "auther": "Author",
    "editor": "Editor",
    "guest-editor": "Guest Editor",
    "group-author": "Group Author",
    "collab": "Collaborator",
    "reviewed-by": "Reviewer",
    "nominated-by": "Nominator",
    "corresp": "Corresponding Author",
    "other": "Other",
    "assoc-editor": "Associate Editor",
    "associate editor": "Associate Editor",
    "series-editor": "Series Editor",
    "contributor": "Contributor",
    "chairman": "Chairman",
    "monographs-editor": "Monographs Editor",
    "contrib-author": "Contributing Author",
    "organizer": "Organizer",
    "chair": "Chair",
    "discussant": "Discussant",
    "presenter": "Presenter",
    "guest-issue-editor": "Guest Issue Editor",
    "participant": "Participant",
    "translator": "Translator"
  };

  this.isAnnotation = function(type) {
    return this._annotationTypes[type] !== undefined;
  };

  this.isParagraphish = function(node) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var el = node.childNodes[i];
      if (el.nodeType !== Node.TEXT_NODE && !this.isAnnotation(el.tagName.toLowerCase())) return false;
    }
    return true;
  };

  this.test = function(xml, documentUrl) {
    /* jshint unused:false */
    return true;
  };

  // Helpers
  // --------

  this.getName = function(nameEl) {
    if (!nameEl) return "N/A";
    var names = [];

    var surnameEl = nameEl.querySelector("surname");
    var givenNamesEl = nameEl.querySelector("given-names");
    var suffix = nameEl.querySelector("suffix");

    if (givenNamesEl) names.push(givenNamesEl.textContent);
    if (surnameEl) names.push(surnameEl.textContent);
    if (suffix) return [names.join(" "), suffix.textContent].join(", ");

    return names.join(" ");
  };

  this.toHtml = function(el) {
    if (!el) return "";
    var tmp = document.createElement("DIV");
    tmp.appendChild(el.cloneNode(true));
    return tmp.innerHTML;
  };

  this.mmlToHtmlString = function(el) {
    var html = this.toHtml(el);
    html = html.replace(/<(\/)?mml:([^>]+)>/g, "<$1$2>");
    return html;
  };

  this.selectDirectChildren = function(scopeEl, selector) {
    // Note: if the ':scope' pseudo class was supported by more browsers
    // it would be the correct selector based solution.
    // However, for now we do simple filtering.
    var result = [];
    var els = scopeEl.querySelectorAll(selector);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.parentElement === scopeEl) result.push(el);
    }
    return result;
  };

  // ### The main entry point for starting an import

  this.import = function(input) {
    var xmlDoc;

    // Note: when we are using jqueries get("<file>.xml") we
    // magically get a parsed XML document already
    if (_.isString(input)) {
      var parser = new DOMParser();
      xmlDoc = parser.parseFromString(input,"text/xml");
    } else {
      xmlDoc = input;
    }

    this.sanitizeXML(xmlDoc);

    // Creating the output Document via factore, so that it is possible to
    // create specialized NLMImporter later which would want to instantiate
    // a specialized Document type
    var doc = this.createDocument();

    // For debug purposes
    window.doc = doc;

    // A deliverable state which makes this importer stateless
    var state = this.createState(xmlDoc, doc);

    // Note: all other methods are called corresponding
    return this.document(state, xmlDoc);
  };

  // Sometimes we need to deal with unconsistent XML
  // When overwriting this function in your custom converter
  // you can solve those issues in a preprocessing step instead of adding
  // hacks in the main converter code

  this.sanitizeXML = function(xmlDoc) {
    /* jshint unused:false */
  };

  this.createState = function(xmlDoc, doc) {
    return new NlmToLensConverter.State(this, xmlDoc, doc);
  };

  // Overridden to create a Lens Article instance
  this.createDocument = function() {

    var doc = new Article();
    return doc;
  };

  this.show = function(state, nodes) {
    _.each(nodes, function(n) {
      this.showNode(state, n);
    }, this);
  };

  this.extractDate = function(dateEl) {
    if (!dateEl) return null;

    var year = dateEl.querySelector("year");
    var month = dateEl.querySelector("month");
    var day = dateEl.querySelector("day");

    var res = [year.textContent];
    if (month) res.push(month.textContent);
    if (day) res.push(day.textContent);

    return res.join("-");
  };

  this.extractPublicationInfo = function(state, article) {
    var doc = state.doc;

    var articleMeta = article.querySelector("article-meta");
    var pubDate = articleMeta.querySelector("pub-date");
    var history = articleMeta.querySelectorAll("history date");

    // Journal title
    //
    var journalTitle = article.querySelector("journal-title");

    // DOI
    //
    // <article-id pub-id-type="doi">10.7554/eLife.00003</article-id>
    var articleDOI = article.querySelector("article-id[pub-id-type=doi]");

    // Related article if exists
    //
    // TODO: can't there be more than one?
    var relatedArticle = article.querySelector("related-article");

    // Article information
    var articleInfo = this.extractArticleInfo(state, article);

    // Create PublicationInfo node
    // ---------------

    var pubInfoNode = {
      "id": "publication_info",
      "type": "publication_info",
      "published_on": this.extractDate(pubDate),
      "journal": journalTitle ? journalTitle.textContent : "",
      "related_article": relatedArticle ? relatedArticle.getAttribute("xlink:href") : "",
      "doi": articleDOI ? articleDOI.textContent : "",
      "article_info": articleInfo.id,
      // TODO: 'article_type' should not be optional; we need to find a good default implementation
      "article_type": "",
      // Optional fields not covered by the default implementation
      // Implement config.enhancePublication() to complement the data
      // TODO: think about how we could provide good default implementations
      "keywords": [],
      "links": [],
      "subjects": [],
      "supplements": [],
      "history": [],
      // TODO: it seems messy to have this in the model
      // Instead it would be cleaner to add 'custom': 'object' field
      "research_organisms": [],
      // TODO: this is in the schema, but seems to be unused
      "provider": "",
    };

    for (var i = 0; i < history.length; i++) {
      var dateEl = history[i];
      var historyEntry = {
        type: dateEl.getAttribute('date-type'),
        date: this.extractDate(dateEl)
      };
      pubInfoNode.history.push(historyEntry);
    }

    doc.create(pubInfoNode);
    doc.show("info", pubInfoNode.id, 0);

    this.enhancePublicationInfo(state, pubInfoNode);
  };

  this.extractArticleInfo = function(state, article) {
    // Initialize the Article Info object
    var articleInfo = {
      "id": "articleinfo",
      "type": "paragraph",
    };
    var doc = state.doc;

    var nodes = [];

    // Reviewing editor
    nodes = nodes.concat(this.extractEditor(state, article));
    // Datasets
    nodes = nodes.concat(this.extractDatasets(state, article));
    // Includes meta information (such as impact statement for eLife)
    nodes = nodes.concat(this.extractCustomMetaGroup(state, article));
    // Acknowledgments
    nodes = nodes.concat(this.extractAcknowledgements(state, article));
    // License and Copyright
    nodes = nodes.concat(this.extractCopyrightAndLicense(state, article));
    // Notes (Footnotes + Author notes)
    nodes = nodes.concat(this.extractNotes(state, article));

    articleInfo.children = nodes;
    doc.create(articleInfo);

    return articleInfo;
  };

  // Get reviewing editor
  // --------------
  // TODO: it is possible to have multiple editors. This does only show the first one
  //   However, this would be easy: just querySelectorAll and have 'Reviewing Editors' as heading when there are multiple nodes found

  this.extractEditor = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var editor = article.querySelector("contrib[contrib-type=editor]");
    if (editor) {
      var content = [];

      var name = this.getName(editor.querySelector('name'));
      if (name) content.push(name);
      var inst = editor.querySelector("institution");
      if (inst) content.push(inst.textContent);
      var country = editor.querySelector("country");
      if (country) content.push(country.textContent);

      var h1 = {
        "type": "heading",
        "id": state.nextId("heading"),
        "level": 3,
        "content": "Reviewing Editor"
      };

      doc.create(h1);
      nodes.push(h1.id);

      var t1 = {
        "type": "text",
        "id": state.nextId("text"),
        "content": content.join(", ")
      };

      doc.create(t1);
      nodes.push(t1.id);
    }
    return nodes;
  };

  //
  // Extracts major datasets
  // -----------------------

  this.extractDatasets = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var datasets = article.querySelectorAll('sec');
    for (var i = 0;i <datasets.length;i++){
      var data = datasets[i];
      var type = data.getAttribute('sec-type');
      if (type === 'datasets') {
        var h1 = {
          "type" : "heading",
          "id" : state.nextId("heading"),
          "level" : 3,
          "content" : "Major Datasets"
        };
        doc.create(h1);
        nodes.push(h1.id);
        var ids = this.datasets(state, util.dom.getChildren(data));
        for (var j=0;j < ids.length;j++) {
          if (ids[j]) {
            nodes.push(ids[j]);
          }
        }
      }
    }
    return nodes;
  };

  var _capitalized = function(str, all) {
    if (all) {
      return str.split(' ').map(function(s){
        return _capitalized(s);
      }).join(' ');
    } else {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  };

  this.capitalized = function(str, all) {
    return _capitalized(str, all);
  };

  //
  // Extracts Acknowledgements
  // -------------------------

  this.extractAcknowledgements = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var acks = article.querySelectorAll("ack");
    if (acks && acks.length > 0) {
      _.each(acks, function(ack) {
        var title = ack.querySelector('title');
        var header = {
          "type" : "heading",
          "id" : state.nextId("heading"),
          "level" : 3,
          "content" : title ? this.capitalized(title.textContent.toLowerCase(), "all") : "Acknowledgements"
        };
        doc.create(header);
        nodes.push(header.id);

        // There may be multiple paragraphs per ack element
        var pars = this.bodyNodes(state, util.dom.getChildren(ack), {
          ignore: ["title"]
        });
        _.each(pars, function(par) {
          nodes.push(par.id);
        });
      }, this);
    }

    return nodes;
  };

  //
  // Extracts footnotes that should be shown in article info
  // ------------------------------------------
  //
  // Needs to be overwritten in configuration

  this.extractNotes = function(/*state, article*/) {
    var nodes = [];
    return nodes;
  };

  // Can be overridden by custom converter to ignore <meta-name> values.
  // TODO: Maybe switch to a whitelisting approach, so we don't show
  // nonsense. See HighWire implementation
  this.__ignoreCustomMetaNames = [];

  this.extractCustomMetaGroup = function(state, article) {
    var nodeIds = [];
    var doc = state.doc;

    var customMetaEls = article.querySelectorAll('article-meta custom-meta');
    if (customMetaEls.length === 0) return nodeIds;

    for (var i = 0; i < customMetaEls.length; i++) {
      var customMetaEl = customMetaEls[i];

      var metaNameEl = customMetaEl.querySelector('meta-name');
      var metaValueEl = customMetaEl.querySelector('meta-value');

      if (!_.include(this.__ignoreCustomMetaNames, metaNameEl.textContent)) {
        var header = {
          "type" : "heading",
          "id" : state.nextId("heading"),
          "level" : 3,
          "content" : ""
        };
        header.content = this.annotatedText(state, metaNameEl, [header.id, 'content']);
        doc.create(header);
        var bodyNodes = this.paragraphGroup(state, metaValueEl);

        nodeIds.push(header.id);
        nodeIds = nodeIds.concat(_.pluck(bodyNodes, 'id'));
      }
    }
    return nodeIds;
  };

  //
  // Extracts Copyright and License Information
  // ------------------------------------------

  this.extractCopyrightAndLicense = function(state, article) {
    var nodes = [];
    var doc = state.doc;

    var license = article.querySelector("permissions");
    if (license) {
      var h1 = {
        "type" : "heading",
        "id" : state.nextId("heading"),
        "level" : 3,
        "content" : "Copyright & License"
      };
      doc.create(h1);
      nodes.push(h1.id);

      // TODO: this is quite messy. We should introduce a dedicated note for article info
      // and do that rendering related things there, e.g., '. ' separator

      var par;
      var copyright = license.querySelector("copyright-statement");
      if (copyright) {
        par = this.paragraphGroup(state, copyright);
        if (par && par.length) {
          nodes = nodes.concat( _.map(par, function(p) { return p.id; } ) );
          // append '.' only if there is none yet
          if (copyright.textContent.trim().slice(-1) !== '.') {
            // TODO: this needs to be more robust... what if there are no children
            var textid = _.last(_.last(par).children);
            doc.nodes[textid].content += ". ";
          }
        }
      }
      var lic = license.querySelector("license");
      if (lic) {
        for (var child = lic.firstElementChild; child; child = child.nextElementSibling) {
          var type = util.dom.getNodeType(child);
          if (type === 'p' || type === 'license-p') {
            par = this.paragraphGroup(state, child);
            if (par && par.length) {
              nodes = nodes.concat( _.pluck(par, 'id') );
            }
          }
        }
      }
    }

    return nodes;
  };

  this.extractCover = function(state, article) {
    var doc = state.doc;
    var docNode = doc.get("document");
    var cover = {
      id: "cover",
      type: "cover",
      title: docNode.title,
      authors: [], // docNode.authors,
      abstract: docNode.abstract
    };

    // Create authors paragraph that has contributor_reference annotations
    // to activate the author cards

    _.each(docNode.authors, function(contributorId) {
      var contributor = doc.get(contributorId);

      var authorsPara = {
        "id": "text_"+contributorId+"_reference",
        "type": "text",
        "content": contributor.name
      };

      doc.create(authorsPara);
      cover.authors.push(authorsPara.id);

      var anno = {
        id: state.nextId("contributor_reference"),
        type: "contributor_reference",
        path: ["text_" + contributorId + "_reference", "content"],
        range: [0, contributor.name.length],
        target: contributorId
      };

      doc.create(anno);
    }, this);

    // Move to elife configuration
    // -------------------
    // <article-categories>
    // <subj-group subj-group-type="display-channel">...</subj-group>
    // <subj-group subj-group-type="heading">...</subj-group>
    // </article-categories>

    // <article-categories>
    //   <subj-group subj-group-type="display-channel">
    //     <subject>Research article</subject>
    //   </subj-group>
    //   <subj-group subj-group-type="heading">
    //     <subject>Biophysics and structural biology</subject>
    //   </subj-group>
    // </article-categories>

    this.enhanceCover(state, cover, article);

    doc.create(cover);
    doc.show("content", cover.id, 0);
  };

  // Note: Substance.Article supports only one author.
  // We use the first author found in the contribGroup for the 'creator' property.
  this.contribGroup = function(state, contribGroup) {
    var i;
    var contribs = contribGroup.querySelectorAll("contrib");
    for (i = 0; i < contribs.length; i++) {
      this.contributor(state, contribs[i]);
    }
    // Extract on-behalf-of element and stick it to the document
    var doc = state.doc;
    var onBehalfOf = contribGroup.querySelector("on-behalf-of");
    if (onBehalfOf) doc.on_behalf_of = onBehalfOf.textContent.trim();
  };

  this.affiliation = function(state, aff) {
    var doc = state.doc;

    var institution = aff.querySelector("institution");
    var country = aff.querySelector("country");
    var label = aff.querySelector("label");
    var department = aff.querySelector("addr-line named-content[content-type=department]");
    var city = aff.querySelector("addr-line named-content[content-type=city]");
    // TODO: there are a lot more elements which can have this.
    var specific_use = aff.getAttribute('specific-use');

    // TODO: this is a potential place for implementing a catch-bin
    // For that, iterate all children elements and fill into properties as needed or add content to the catch-bin

    var affiliationNode = {
      id: state.nextId("affiliation"),
      type: "affiliation",
      source_id: aff.getAttribute("id"),
      label: label ? label.textContent : null,
      department: department ? department.textContent : null,
      city: city ? city.textContent : null,
      institution: institution ? institution.textContent : null,
      country: country ? country.textContent: null,
      specific_use: specific_use || null
    };
    doc.create(affiliationNode);
  };

  this.contributor = function(state, contrib) {
    var doc = state.doc;

    var id = state.nextId("contributor");
    var contribNode = {
      id: id,
      source_id: contrib.getAttribute("id"),
      type: "contributor",
      name: "",
      affiliations: [],
      fundings: [],
      bio: [],

      // Not yet supported... need examples
      image: "",
      deceased: false,
      emails: [],
      contribution: "",
      members: []
    };

    // Extract contrib type
    var contribType = contrib.getAttribute("contrib-type");

    // Assign human readable version
    contribNode["contributor_type"] = this._contribTypeMapping[contribType];

    // Extract role
    var role = contrib.querySelector("role");
    if (role) {
      contribNode["role"] = role.textContent;
    }

    // Search for author bio and author image
    var bio = contrib.querySelector("bio");
    if (bio) {
      _.each(util.dom.getChildren(bio), function(par) {
        var graphic = par.querySelector("graphic");
        if (graphic) {
          var imageUrl = graphic.getAttribute("xlink:href");
          contribNode.image = imageUrl;
        } else {
          var pars = this.paragraphGroup(state, par);
          if (pars.length > 0) {
            contribNode.bio = [ pars[0].id ];
          }
        }
      }, this);
    }

    // Deceased?

    if (contrib.getAttribute("deceased") === "yes") {
      contribNode.deceased = true;
    }

    // Extract ORCID
    // -----------------
    //
    // <uri content-type="orcid" xlink:href="http://orcid.org/0000-0002-7361-560X"/>

    var orcidURI = contrib.querySelector("uri[content-type=orcid]");
    if (orcidURI) {
      contribNode.orcid = orcidURI.getAttribute("xlink:href");
    }

    // Extracting equal contributions
    var nameEl = contrib.querySelector("name");
    if (nameEl) {
      contribNode.name = this.getName(nameEl);
    } else {
      var collab = contrib.querySelector("collab");
      // Assuming this is an author group
      if (collab) {
        contribNode.name = collab.textContent;
      } else {
        contribNode.name = "N/A";
      }
    }

    this.extractContributorProperties(state, contrib, contribNode);


    // HACK: for cases where no explicit xrefs are given per
    // contributor we assin all available affiliations
    if (contribNode.affiliations.length === 0) {
      contribNode.affiliations = state.affiliations;
    }

    // HACK: if author is assigned a conflict, remove the redundant
    // conflict entry "The authors have no competing interests to declare"
    // This is a data-modelling problem on the end of our input XML
    // so we need to be smart about it in the converter
    if (contribNode.competing_interests.length > 1) {
      contribNode.competing_interests = _.filter(contribNode.competing_interests, function(confl) {
        return confl.indexOf("no competing") < 0;
      });
    }

    if (contrib.getAttribute("contrib-type") === "author") {
      doc.nodes.document.authors.push(id);
    }

    doc.create(contribNode);
    doc.show("info", contribNode.id);
  };

  this._getEqualContribs = function (state, contrib, contribId) {
    var result = [];
    var refs = state.xmlDoc.querySelectorAll("xref[rid="+contribId+"]");
    // Find xrefs within contrib elements
    _.each(refs, function(ref) {
      var c = ref.parentNode;
      if (c !== contrib) result.push(this.getName(c.querySelector("name")));
    }, this);
    return result;
  };

  this.extractContributorProperties = function(state, contrib, contribNode) {
    var doc = state.doc;

    // Extract equal contributors
    var equalContribs = [];
    var compInterests = [];

    // extract affiliations stored as xrefs
    var xrefs = contrib.querySelectorAll("xref");
    _.each(xrefs, function(xref) {
      if (xref.getAttribute("ref-type") === "aff") {
        var affId = xref.getAttribute("rid");
        var affNode = doc.getNodeBySourceId(affId);
        if (affNode) {
          contribNode.affiliations.push(affNode.id);
          state.used[affId] = true;
        }
      } else if (xref.getAttribute("ref-type") === "other") {
        // FIXME: it seems *very* custom to interprete every 'other' that way
        // TODO: try to find and document when this is applied
        console.log("FIXME: please add documentation about using 'other' as indicator for extracting an awardGroup.");

        var awardGroup = state.xmlDoc.getElementById(xref.getAttribute("rid"));
        if (!awardGroup) return;
        var fundingSource = awardGroup.querySelector("funding-source");
        if (!fundingSource) return;
        var awardId = awardGroup.querySelector("award-id");
        awardId = awardId ? ", "+awardId.textContent : "";
        // Funding source nodes are looking like this
        //
        // <funding-source>
        //   National Institutes of Health
        //   <named-content content-type="funder-id">http://dx.doi.org/10.13039/100000002</named-content>
        // </funding-source>
        //
        // and we only want to display the first text node, excluding the funder id
        var fundingSourceName = fundingSource.childNodes[0].textContent;
        contribNode.fundings.push([fundingSourceName, awardId].join(''));
      } else if (xref.getAttribute("ref-type") === "corresp") {
        var correspId = xref.getAttribute("rid");
        var corresp = state.xmlDoc.getElementById(correspId);
        if (!corresp) return;
        // TODO: a corresp element allows *much* more than just an email
        // Thus, we are leaving this like untouched, so that it may be grabbed by extractAuthorNotes()
        // state.used[correspId] = true;
        var email = corresp.querySelector("email");
        if (!email) return;
        contribNode.emails.push(email.textContent);
      } else if (xref.getAttribute("ref-type") === "fn") {
        var fnId = xref.getAttribute("rid");
        var fnElem = state.xmlDoc.getElementById(fnId);
        var used = true;
        if (fnElem) {
          var fnType = fnElem.getAttribute("fn-type");
          switch (fnType) {
            case "con":
              contribNode.contribution = fnElem.textContent;
              break;
            case "conflict":
              compInterests.push(fnElem.textContent.trim());
              break;
            case "present-address":
              contribNode.present_address = fnElem.querySelector("p").textContent;
              break;
            case "equal":
              console.log("FIXME: isn't fnElem.getAttribute(id) === fnId?");
              equalContribs = this._getEqualContribs(state, contrib, fnElem.getAttribute("id"));
              break;
            case "other":
              // HACK: sometimes equal contribs are encoded as 'other' plus special id
              console.log("FIXME: isn't fnElem.getAttribute(id) === fnId?");
              if (fnElem.getAttribute("id").indexOf("equal-contrib")>=0) {
                equalContribs = this._getEqualContribs(state, contrib, fnElem.getAttribute("id"));
              } else {
                used = false;
              }
              break;
            default:
              used = false;
          }
          if (used) state.used[fnId] = true;
        }
      } else {
        // TODO: this is a potential place for implementing a catch-bin
        // For that, we could push the content of the referenced element into the contrib's catch-bin
        console.log("Skipping contrib's xref", xref.textContent);
      }
    }, this);

    // Extract member list for person group
    // eLife specific?
    // ----------------

    if (compInterests.length > 1) {
      compInterests = _.filter(compInterests, function(confl) {
        return confl.indexOf("no competing") < 0;
      });
    }

    contribNode.competing_interests = compInterests;
    var memberList = contrib.querySelector("xref[ref-type=other]");

    if (memberList) {
      var memberListId = memberList.getAttribute("rid");
      var members = state.xmlDoc.querySelectorAll("#"+memberListId+" contrib");
      contribNode.members = _.map(members, function(m) {
        return this.getName(m.querySelector("name"));
      }, this);
    }

    contribNode.equal_contrib = equalContribs;
    contribNode.competing_interests = compInterests;
  };

  // Parser
  // --------
  // These methods are used to process XML elements in
  // using a recursive-descent approach.


  // ### Top-Level function that takes a full NLM tree
  // Note: a specialized converter can derive this method and
  // add additional pre- or post-processing.

  this.document = function(state, xmlDoc) {
    var doc = state.doc;
    var article = xmlDoc.querySelector("article");
    if (!article) {
      throw new ImporterError("Expected to find an 'article' element.");
    }
    // recursive-descent for the main body of the article
    this.article(state, article);
    this.postProcess(state);
    // Rebuild views to ensure consistency
    _.each(doc.containers, function(container) {
      container.rebuild();
    });
    return doc;
  };

  this.postProcess = function(state) {
    this.postProcessAnnotations(state);
  };

  this.postProcessAnnotations = function(state) {
    // Creating the annotations afterwards, to make sure
    // that all referenced nodes are available
    for (var i = 0; i < state.annotations.length; i++) {
      var anno = state.annotations[i];
      if (anno.target) {
        var targetNode = state.doc.getNodeBySourceId(anno.target);
        if (targetNode) {
          anno.target = targetNode.id;
        } else {
          // NOTE: I've made this silent because it frequently occurs that no targetnode is
          // available (e.g. for inline formulas)
          // console.log("Could not lookup targetNode for annotation", anno);
        }
      }
      state.doc.create(state.annotations[i]);
    }
  };

  // Article
  // --------
  // Does the actual conversion.
  //
  // Note: this is implemented as lazy as possible (ALAP) and will be extended as demands arise.
  //
  // If you need such an element supported:
  //  - add a stub to this class (empty body),
  //  - add code to call the method to the appropriate function,
  //  - and implement the handler here if it can be done in general way
  //    or in your specialized importer.

  this.article = function(state, article) {
    var doc = state.doc;

    // Assign id
    var articleId = article.querySelector("article-id");
    // Note: Substance.Article does only support one id
    if (articleId) {
      doc.id = articleId.textContent;
    } else {
      // if no id was set we create a random one
      doc.id = util.uuid();
    }

    // Extract glossary
    this.extractDefinitions(state, article);

    // Extract authors etc.
    this.extractAffilitations(state, article);
    this.extractContributors(state, article);

    // Same for the citations, also globally
    this.extractCitations(state, article);

    // Make up a cover node
    this.extractCover(state, article);

    // Extract ArticleMeta
    this.extractArticleMeta(state, article);

    // Populate Publication Info node
    this.extractPublicationInfo(state, article);

    var body = article.querySelector("body");
    if (body) {
      this.body(state, body);
    }

    this.extractFigures(state, article);

    // Extract back element, if it exists
    var back = article.querySelector("back");
    if (back){
        this.back(state,back);
    }

    this.enhanceArticle(state, article);
  };

  this.extractDefinitions = function(state /*, article*/) {
    var defItems = state.xmlDoc.querySelectorAll("def-item");

    _.each(defItems, function(defItem) {
      var term = defItem.querySelector("term");
      var def = defItem.querySelector("def");

      // using hwp:id as a fallback MCP articles don't have def.id set
      var id = def.id || def.getAttribute("hwp:id") || state.nextId('definition');

      var definitionNode = {
        id: id,
        type: "definition",
        title: term.textContent,
        description: def.textContent
      };

      state.doc.create(definitionNode);
      state.doc.show("definitions", definitionNode.id);
    });
  };

  // #### Front.ArticleMeta
  //

  this.extractArticleMeta = function(state, article) {
    var articleMeta = article.querySelector("article-meta");
    if (!articleMeta) {
      throw new ImporterError("Expected element: 'article-meta'");
    }

    // <article-id> Article Identifier, zero or more
    var articleIds = articleMeta.querySelectorAll("article-id");
    this.articleIds(state, articleIds);

    // <title-group> Title Group, zero or one
    var titleGroup = articleMeta.querySelector("title-group");
    if (titleGroup) {
      this.titleGroup(state, titleGroup);
    }

    // <pub-date> Publication Date, zero or more
    var pubDates = articleMeta.querySelectorAll("pub-date");
    this.pubDates(state, pubDates);

    this.abstracts(state, articleMeta);

    // Not supported yet:
    // <trans-abstract> Translated Abstract, zero or more
    // <kwd-group> Keyword Group, zero or more
    // <conference> Conference Information, zero or more
    // <counts> Counts, zero or one
    // <custom-meta-group> Custom Metadata Group, zero or one
  };

  this.extractAffilitations = function(state, article) {
    var affiliations =  article.querySelectorAll("aff");
    for (var i = 0; i < affiliations.length; i++) {
      this.affiliation(state, affiliations[i]);
    }
  };

  this.extractContributors = function(state, article) {
    // TODO: the spec says, that there may be any combination of
    // 'contrib-group', 'aff', 'aff-alternatives', and 'x'
    // However, in the articles seen so far, these were sub-elements of 'contrib-group', which itself was single
    var contribGroup = article.querySelector("article-meta contrib-group");
    if (contribGroup) {
      this.contribGroup(state, contribGroup);
    }

  };

  // Catch-all implementation for figures et al.
  this.extractFigures = function(state, xmlDoc) {
    // Globally query all figure-ish content, <fig>, <supplementary-material>, <table-wrap>, <media video>
    // mimetype="video"
    
    // NOTE: We previously only considered figures within <body> but since
    // appendices can also have figures we now use a gobal selector.
    var figureElements = xmlDoc.querySelectorAll("fig, table-wrap, supplementary-material, media[mimetype=video]");
    var nodes = [];
    for (var i = 0; i < figureElements.length; i++) {
      var figEl = figureElements[i];
      // skip converted elements
      if (figEl._converted) continue;
      var type = util.dom.getNodeType(figEl);
      var node = null;
      if (type === "fig") {
        node = this.figure(state, figEl);
      } else if (type === "table-wrap") {
        node = this.tableWrap(state, figEl);
      } else if (type === "media") {
        node = this.video(state, figEl);
      } else if (type === "supplementary-material") {
        node = this.supplement(state, figEl);
      }
      if (node) {
        nodes.push(node);
      }
    }
    this.show(state, nodes);
  };

  this.extractCitations = function(state, xmlDoc) {
    var refList = xmlDoc.querySelector("ref-list");
    if (refList) {
      this.refList(state, refList);
    }
  };

  // articleIds: array of <article-id> elements
  this.articleIds = function(state, articleIds) {
    var doc = state.doc;

    // Note: Substance.Article does only support one id
    if (articleIds.length > 0) {
      doc.id = articleIds[0].textContent;
    } else {
      // if no id was set we create a random one
      doc.id = util.uuid();
    }
  };

  this.titleGroup = function(state, titleGroup) {
    var doc = state.doc;
    var articleTitle = titleGroup.querySelector("article-title");
    if (articleTitle) {
      doc.title = this.annotatedText(state, articleTitle, ['document', 'title'], {
        ignore: ['xref']
      });
    }
    // Not yet supported:
    // <subtitle> Document Subtitle, zero or one
  };

  // Note: Substance.Article supports no publications directly.
  // We use the first pub-date for created_at
  this.pubDates = function(state, pubDates) {
    var doc = state.doc;
    if (pubDates.length > 0) {
      var converted = this.pubDate(state, pubDates[0]);
      doc.created_at = converted.date;
    }
  };

  // Note: this does not follow the spec but only takes the parts as it was necessary until now
  // TODO: implement it thoroughly
  this.pubDate = function(state, pubDate) {
    var day = -1;
    var month = -1;
    var year = -1;
    _.each(util.dom.getChildren(pubDate), function(el) {
      var type = util.dom.getNodeType(el);

      var value = el.textContent;
      if (type === "day") {
        day = parseInt(value, 10);
      } else if (type === "month") {
        month = parseInt(value, 10);
      } else if (type === "year") {
        year = parseInt(value, 10);
      }
    }, this);
    var date = new Date(year, month, day);
    return {
      date: date
    };
  };

  this.abstracts = function(state, articleMeta) {
    // <abstract> Abstract, zero or more
    var abstracts = articleMeta.querySelectorAll("abstract");
    _.each(abstracts, function(abs) {
      this.abstract(state, abs);
    }, this);
  };

  // TODO: abstract should be a dedicated node
  // as it can have some extra information in JATS, such as specific-use
  this.abstract = function(state, abs) {
    var doc = state.doc;
    var nodes = [];

    var title = abs.querySelector("title");

    var heading = {
      id: state.nextId("heading"),
      type: "heading",
      level: 1,
      content: title ? title.textContent : "Abstract"
    };

    doc.create(heading);
    nodes.push(heading);

    // with eLife there are abstracts having an object-id.
    // TODO: we should store that in the model instead of dropping it

    nodes = nodes.concat(this.bodyNodes(state, util.dom.getChildren(abs), {
      ignore: ["title", "object-id"]
    }));

    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  // ### Article.Body
  //

  this.body = function(state, body) {
    var doc = state.doc;
    var heading = {
      id: state.nextId("heading"),
      type: "heading",
      level: 1,
      content: "Main Text"
    };
    doc.create(heading);
    var nodes = [heading].concat(this.bodyNodes(state, util.dom.getChildren(body)));
    if (nodes.length > 0) {
      this.show(state, nodes);
    }
  };

  this._ignoredBodyNodes = {
    // figures and table-wraps are treated globally
    "fig": true,
    "table-wrap": true
  };

  // Top-level elements as they can be found in the body or
  // in a section
  // Note: this is also used for boxed-text elements
  this._bodyNodes = {};

  this.bodyNodes = function(state, children, options) {
    var nodes = [], node;

    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (this._bodyNodes[type]) {
        var result = this._bodyNodes[type].call(this, state, child);
        if (_.isArray(result)) {
          nodes = nodes.concat(result);
        } else if (result) {
          nodes.push(result);
        } else {
          // skip
        }
      } else if (this._ignoredBodyNodes[type] || (options && options.ignore && options.ignore.indexOf(type) >= 0) ) {
        // Note: here are some node types ignored which are
        // processed in an extra pass (figures, tables, etc.)
        node = this.ignoredNode(state, child, type);
        if (node) nodes.push(node);
      } else {
        console.error("Node not yet supported as top-level node: " + type);
      }
    }
    return nodes;
  };

  this._bodyNodes["p"] = function(state, child) {
    return this.paragraphGroup(state, child);
  };
  this._bodyNodes["sec"] = function(state, child) {
    return this.section(state, child);
  };
  this._bodyNodes["list"] = function(state, child) {
    return this.list(state, child);
  };
  this._bodyNodes["disp-formula"] = function(state, child) {
    return this.formula(state, child);
  };
  this._bodyNodes["caption"] = function(state, child) {
    return this.caption(state, child);
  };
  this._bodyNodes["boxed-text"] = function(state, child) {
    return this.boxedText(state, child);
  };
  this._bodyNodes["disp-quote"] = function(state, child) {
    return this.boxedText(state, child);
  };
  this._bodyNodes["attrib"] = function(state, child) {
    return this.paragraphGroup(state, child);
  };
  this._bodyNodes["comment"] = function(state, child) {
    return this.comment(state, child);
  };
  this._bodyNodes["fig"] = function(state, child) {
    return this.figure(state, child);
  };

  // Overwirte in specific converter
  this.ignoredNode = function(/*state, node, type*/) {
  };

  this.comment = function(/*state, comment*/) {
    // TODO: this is not yet represented in the article data model
    return null;
  };

  this.boxedText = function(state, box) {
    var doc = state.doc;
    // Assuming that there are no nested <boxed-text> elements
    var childNodes = this.bodyNodes(state, util.dom.getChildren(box));
    var boxId = state.nextId("box");
    var boxNode = {
      "type": "box",
      "id": boxId,
      "source_id": box.getAttribute("id"),
      "label": "",
      "children": _.pluck(childNodes, 'id')
    };
    doc.create(boxNode);
    return boxNode;
  };

  this.datasets = function(state, datasets) {
    var nodes = [];

    for (var i=0;i<datasets.length;i++) {
      var data = datasets[i];
      var type = util.dom.getNodeType(data);
      if (type === 'p') {
        var obj = data.querySelector('related-object');
        if (obj) {
          nodes = nodes.concat(this.indivdata(state,obj));
        }
        else {
          var par = this.paragraphGroup(state, data);
          if (par.length > 0) nodes.push(par[0].id);
        }
      }
    }
    return nodes;
  };

  this.indivdata = function(state,indivdata) {
    var doc = state.doc;

    var p1 = {
      "type" : "paragraph",
      "id" : state.nextId("paragraph"),
      "children" : []
    };
    var text1 = {
      "type" : "text",
      "id" : state.nextId("text"),
      "content" : ""
    };
    p1.children.push(text1.id);
    var input = util.dom.getChildren(indivdata);
    for (var i = 0;i<input.length;i++) {
      var info = input[i];
      var type = util.dom.getNodeType(info);
      var par;
      if (type === "name") {
        var children = util.dom.getChildren(info);
        for (var j = 0;j<children.length;j++) {
          var name = children[j];
          if (j === 0) {
            par = this.paragraphGroup(state,name);
            p1.children.push(par[0].children[0]);
          }
          else {
            var text2 = {
              "type" : "text",
              "id" : state.nextId("text"),
              "content" : ", "
            };
            doc.create(text2);
            p1.children.push(text2.id);
            par = this.paragraphGroup(state,name);
            p1.children.push(par[0].children[0]);
          }
        }
      }
      else {
        par = this.paragraphGroup(state,info);
        // Smarter null reference check?
        if (par && par[0] && par[0].children) {
          p1.children.push(par[0].children[0]);
        }
      }
    }
    doc.create(p1);
    doc.create(text1);
    return p1.id;
  };

  this.section = function(state, section) {
    // pushing the section level to track the level for nested sections
    state.sectionLevel++;

    var doc = state.doc;
    var children = util.dom.getChildren(section);
    var nodes = [];

    // Optional heading label
    var label = this.selectDirectChildren(section, "label")[0];

    // create a heading
    var title = this.selectDirectChildren(section, 'title')[0];
    if (!title) {
      console.error("FIXME: every section should have a title", this.toHtml(section));
    }

    // Recursive Descent: get all section body nodes
    nodes = nodes.concat(this.bodyNodes(state, children, {
      ignore: ["title", "label"]
    }));

    if (nodes.length > 0 && title) {
      var id = state.nextId("heading");
      var heading = {
        id: id,
        source_id: section.getAttribute("id"),
        type: "heading",
        level: state.sectionLevel,
        content: title ? this.annotatedText(state, title, [id, 'content']) : ""
      };

      if (label) {
        heading.label = label.textContent;
      }

      if (heading.content.length > 0) {
        doc.create(heading);
        nodes.unshift(heading);
      }
    } else if (nodes.length === 0) {
      console.info("NOTE: skipping section without content:", title ? title.innerHTML : "no title");
    }

    // popping the section level
    state.sectionLevel--;
    return nodes;
  };

  this.ignoredParagraphElements = {
    "comment": true,
    "supplementary-material": true,
    "fig": true,
    "fig-group": true,
    "table-wrap": true,
    "media": true
  };

  this.acceptedParagraphElements = {
    "boxed-text": {handler: "boxedText"},
    "list": { handler: "list" },
    "disp-formula": { handler: "formula" },
  };

  this.inlineParagraphElements = {
    "inline-graphic": true,
    "inline-formula": true
  };

  // Segments children elements of a NLM <p> element
  // into blocks grouping according to following rules:
  // - "text", "inline-graphic", "inline-formula", and annotations
  // - ignore comments, supplementary-materials
  // - others are treated as singles
  this.segmentParagraphElements = function(paragraph) {
    var blocks = [];
    var lastType = "";
    var iterator = new util.dom.ChildNodeIterator(paragraph);

    // first fragment the childNodes into blocks
    while (iterator.hasNext()) {
      var child = iterator.next();
      var type = util.dom.getNodeType(child);

      // ignore some elements
      if (this.ignoredParagraphElements[type]) continue;

      // paragraph block-types such as disp-formula
      // i.e they are allowed within a paragraph, but
      // we pull them out on the top level
      if (this.acceptedParagraphElements[type]) {
        blocks.push(_.extend({node: child}, this.acceptedParagraphElements[type]));
      }
      // paragraph elements
      //if (type === "text" || this.isAnnotation(type) || this.inlineParagraphElements[type]) {
      else {
        if (lastType !== "paragraph") {
          blocks.push({ handler: "paragraph", nodes: [] });
          lastType = "paragraph";
        }
        _.last(blocks).nodes.push(child);
        continue;
      }

      lastType = type;
    }
    return blocks;
  };


  // A 'paragraph' is given a '<p>' tag
  // An NLM <p> can contain nested elements that are represented flattened in a Substance.Article
  // Hence, this function returns an array of nodes
  this.paragraphGroup = function(state, paragraph) {
    var nodes = [];

    // Note: there are some elements in the NLM paragraph allowed
    // which are flattened here. To simplify further processing we
    // segment the children of the paragraph elements in blocks
    var blocks = this.segmentParagraphElements(paragraph);

    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i];
      var node;
      if (block.handler === "paragraph") {
        node = this.paragraph(state, block.nodes);
        if (node) node.source_id = paragraph.getAttribute("id");
      } else {
        node = this[block.handler](state, block.node);
      }
      if (node) nodes.push(node);
    }

    return nodes;
  };

  // DEPRECATED: using this handler for <p> elements is
  // deprecated, as in JATS <p> can contain certain block-level
  // elements. Better use this.paragraphGroup in cases where you
  // convert <p> elements.
  // TODO: we should refactor this and make it a 'private' helper
  this.paragraph = function(state, children) {
    var doc = state.doc;

    // Reset whitespace handling at the beginning of a paragraph.
    // I.e., whitespaces at the beginning will be removed rigorously.
    state.skipWS = true;

    var node = {
      id: state.nextId("paragraph"),
      type: "paragraph",
      children: null
    };
    var nodes = [];

    var iterator = new util.dom.ChildNodeIterator(children);
    while (iterator.hasNext()) {
      var child = iterator.next();
      var type = util.dom.getNodeType(child);

      // annotated text node
      if (type === "text" || this.isAnnotation(type)) {
        var textNode = {
          id: state.nextId("text"),
          type: "text",
          content: null
        };
        // pushing information to the stack so that annotations can be created appropriately
        state.stack.push({
          path: [textNode.id, "content"]
        });
        // Note: this will consume as many textish elements (text and annotations)
        // but will return when hitting the first un-textish element.
        // In that case, the iterator will still have more elements
        // and the loop is continued
        // Before descending, we reset the iterator to provide the current element again.
        // TODO: We have disabled the described behavior as it seems
        // worse to break automatically on unknown inline tags,
        // than to render plain text, as it results in data loss.
        // If you find a situation where you want to flatten structure
        // found within a paragraph, use this.acceptedParagraphElements instead
        // which is used in a preparation step before converting paragraphs.
        var annotatedText = this._annotatedText(state, iterator.back(), { offset: 0, breakOnUnknown: false });

        // Ignore empty paragraphs
        if (annotatedText.length > 0) {
          textNode.content = annotatedText;
          doc.create(textNode);
          nodes.push(textNode);
        }

        // popping the stack
        state.stack.pop();
      }
      // inline image node
      else if (type === "inline-graphic") {
        var url = child.getAttribute("xlink:href");
        var img = {
          id: state.nextId("image"),
          type: "image",
          url: this.resolveURL(state, url)
        };
        doc.create(img);
        nodes.push(img);
      }
      else if (type === "inline-formula") {
        var formula = this.formula(state, child, "inline");
        if (formula) {
          nodes.push(formula);
        }
      }
    }

    // return if there is no content
    if (nodes.length === 0) return null;

    // FIXME: ATM we can not unwrap single nodes, as there is code relying
    // on getting a paragraph with children
    // // if there is only a single node, do not create a paragraph around it
    // if (nodes.length === 1) {
    //   return nodes[0];
    // } else {
    //   node.children = _.map(nodes, function(n) { return n.id; } );
    //   doc.create(node);
    //   return node;
    // }

    node.children = _.map(nodes, function(n) { return n.id; } );
    doc.create(node);
    return node;
  };

  // List type
  // --------

  this.list = function(state, list) {
    var doc = state.doc;

    var listNode = {
      "id": state.nextId("list"),
      "source_id": list.getAttribute("id"),
      "type": "list",
      "items": [],
      "ordered": false
    };

    // TODO: better detect ordererd list types (need examples)
    if (list.getAttribute("list-type") === "ordered") {
      listNode.ordered = true;
    }

    var listItems = list.querySelectorAll("list-item");
    for (var i = 0; i < listItems.length; i++) {
      var listItem = listItems[i];
      // Note: we do not care much about what is served as items
      // However, we do not have complex nodes on paragraph level
      // They will be extract as sibling items
      var nodes = this.bodyNodes(state, util.dom.getChildren(listItem));
      for (var j = 0; j < nodes.length; j++) {
        listNode.items.push(nodes[j].id);
      }
    }

    doc.create(listNode);
    return listNode;
  };

  // Handle <fig> element
  // --------
  //

  this.figure = function(state, figure) {
    var doc = state.doc;

    // Top level figure node
    var figureNode = {
      "type": "figure",
      "id": state.nextId("figure"),
      "source_id": figure.getAttribute("id"),
      "label": "Figure",
      "url": "",
      "caption": null
    };

    var labelEl = figure.querySelector("label");
    if (labelEl) {
      figureNode.label = this.annotatedText(state, labelEl, [figureNode.id, 'label']);
    }

    // Add a caption if available
    var caption = figure.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) figureNode.caption = captionNode.id;
    }

    var attrib = figure.querySelector("attrib");
    if (attrib) {
      figureNode.attrib = attrib.textContent;
    }

    var position = figure.getAttribute('position');
    if (position) {
      figureNode.position = position || '';
    }

    // Lets the configuration patch the figure node properties
    this.enhanceFigure(state, figureNode, figure);
    doc.create(figureNode);

    //HACK: add this information so that we can implement the catch-all converter for figures et al.
    figure._converted = true;

    return figureNode;
  };

  // Handle <supplementary-material> element
  // --------
  //
  // eLife Example:
  //
  // <supplementary-material id="SD1-data">
  //   <object-id pub-id-type="doi">10.7554/eLife.00299.013</object-id>
  //   <label>Supplementary file 1.</label>
  //   <caption>
  //     <title>Compilation of the tables and figures (XLS).</title>
  //     <p>This is a static version of the
  //       <ext-link ext-link-type="uri" xlink:href="http://www.vaxgenomics.org/vaxgenomics/" xmlns:xlink="http://www.w3.org/1999/xlink">
  //         Interactive Results Tool</ext-link>, which is also available to download from Zenodo (see major datasets).</p>
  //     <p>
  //       <bold>DOI:</bold>
  //       <ext-link ext-link-type="doi" xlink:href="10.7554/eLife.00299.013">http://dx.doi.org/10.7554/eLife.00299.013</ext-link>
  //     </p>
  //   </caption>
  //   <media mime-subtype="xlsx" mimetype="application" xlink:href="elife00299s001.xlsx"/>
  // </supplementary-material>
  //
  // LB Example:
  //
  // <supplementary-material id="SUP1" xlink:href="2012INTRAVITAL024R-Sup.pdf">
  //   <label>Additional material</label>
  //   <media xlink:href="2012INTRAVITAL024R-Sup.pdf"/>
  // </supplementary-material>

  this.supplement = function(state, supplement) {
    var doc = state.doc;

    //get supplement info
    var label = supplement.querySelector("label");

    var mediaEl = supplement.querySelector("media");
    var url = mediaEl ? mediaEl.getAttribute("xlink:href") : null;
    var doi = supplement.querySelector("object-id[pub-id-type='doi']");
    doi = doi ? "http://dx.doi.org/" + doi.textContent : "";

    //create supplement node using file ids
    var supplementNode = {
      "id": state.nextId("supplement"),
      "source_id": supplement.getAttribute("id"),
      "type": "supplement",
      "label": label ? label.textContent : "",
      "url": url,
      "caption": null
    };

    // Add a caption if available
    var caption = supplement.querySelector("caption");

    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) supplementNode.caption = captionNode.id;
    }

    // Let config enhance the node
    this.enhanceSupplement(state, supplementNode, supplement);
    doc.create(supplementNode);

    return supplementNode;
  };

  // Used by Figure, Table, Video, Supplement types.
  // --------

  this.caption = function(state, caption) {
    var doc = state.doc;

    var captionNode = {
      "id": state.nextId("caption"),
      "source_id": caption.getAttribute("id"),
      "type": "caption",
      "title": "",
      "children": []
    };

    // Titles can be annotated, thus delegate to paragraph
    var title = caption.querySelector("title");
    if (title) {
      // Resolve title by delegating to the paragraph
      var node = this.paragraph(state, title);
      if (node) {
        captionNode.title = node.id;
      }
    }

    var children = [];
    var paragraphs = caption.querySelectorAll("p");
    _.each(paragraphs, function(p) {
      // Only consider direct children
      if (p.parentNode !== caption) return;
      var node = this.paragraph(state, p);
      if (node) children.push(node.id);
    }, this);

    captionNode.children = children;
    doc.create(captionNode);

    return captionNode;
  };

  // Example video element
  //
  // <media content-type="glencoe play-in-place height-250 width-310" id="movie1" mime-subtype="mov" mimetype="video" xlink:href="elife00005m001.mov">
  //   <object-id pub-id-type="doi">
  //     10.7554/eLife.00005.013</object-id>
  //   <label>Movie 1.</label>
  //   <caption>
  //     <title>Movement of GFP tag.</title>
  //     <p>
  //       <bold>DOI:</bold>
  //       <ext-link ext-link-type="doi" xlink:href="10.7554/eLife.00005.013">http://dx.doi.org/10.7554/eLife.00005.013</ext-link>
  //     </p>
  //   </caption>
  // </media>

  this.video = function(state, video) {
    var doc = state.doc;
    var label = video.querySelector("label").textContent;

    var id = state.nextId("video");
    var videoNode = {
      "id": id,
      "source_id": video.getAttribute("id"),
      "type": "video",
      "label": label,
      "title": "",
      "caption": null,
      "poster": ""
    };

    // Add a caption if available
    var caption = video.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) videoNode.caption = captionNode.id;
    }

    this.enhanceVideo(state, videoNode, video);
    doc.create(videoNode);

    return videoNode;
  };

  this.tableWrap = function(state, tableWrap) {
    var doc = state.doc;
    var label = tableWrap.querySelector("label");

    var tableNode = {
      "id": state.nextId("html_table"),
      "source_id": tableWrap.getAttribute("id"),
      "type": "html_table",
      "title": "",
      "label": label ? label.textContent : "Table",
      "content": "",
      "caption": null,
      // Not supported yet ... need examples
      footers: [],
      // doi: "" needed?
    };

    // Note: using a DOM div element to create HTML
    var table = tableWrap.querySelector("table");
    if (table) {
      tableNode.content = this.toHtml(table);
    }
    this.extractTableCaption(state, tableNode, tableWrap);

    this.enhanceTable(state, tableNode, tableWrap);
    doc.create(tableNode);
    return tableNode;
  };

  this.extractTableCaption = function(state, tableNode, tableWrap) {
    // Add a caption if available
    var caption = tableWrap.querySelector("caption");
    if (caption) {
      var captionNode = this.caption(state, caption);
      if (captionNode) tableNode.caption = captionNode.id;
    } else {
      console.error('caption node not found for', tableWrap);
    }
  };

  // Formula Node Type
  // --------

  this._getFormulaData = function(formulaElement) {
    var result = [];
    for (var child = formulaElement.firstElementChild; child; child = child.nextElementSibling) {
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
          result.push({
            format: "svg",
            data: this.toHtml(child)
          });
          break;
        case "mml:math":
        case "math":
          result.push({
            format: "mathml",
            data: this.mmlToHtmlString(child)
          });
          break;
        case "tex-math":
          result.push({
            format: "latex",
            data: child.textContent
          });
          break;
        case "label":
          // Skipping - is handled in this.formula()
          break;
        default:
          console.error('Unsupported formula element of type ' + type);
      }
    }
    return result;
  };

  this.formula = function(state, formulaElement, inline) {
    var doc = state.doc;
    var formulaNode = {
      id: state.nextId("formula"),
      source_id: formulaElement.getAttribute("id"),
      type: "formula",
      label: "",
      inline: !!inline,
      data: [],
      format: [],
    };
    var label = formulaElement.querySelector("label");
    if (label) formulaNode.label = label.textContent;
    var formulaData = this._getFormulaData(formulaElement, inline);
    for (var i = 0; i < formulaData.length; i++) {
      formulaNode.format.push(formulaData[i].format);
      formulaNode.data.push(formulaData[i].data);
    }
    doc.create(formulaNode);
    return formulaNode;
  };

  // Citations
  // ---------

  this.citationTypes = {
    "mixed-citation": true,
    "element-citation": true
  };

  this.refList = function(state, refList) {
    var refs = refList.querySelectorAll("ref");
    for (var i = 0; i < refs.length; i++) {
      this.ref(state, refs[i]);
    }
  };

  this.ref = function(state, ref) {
    var children = util.dom.getChildren(ref);
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      var type = util.dom.getNodeType(child);

      if (this.citationTypes[type]) {
        this.citation(state, ref, child);
      } else if (type === "label") {
        // skip the label here...
        // TODO: could we do something useful with it?
      } else {
        console.error("Not supported in 'ref': ", type);
      }
    }
  };

  // Citation
  // ------------------
  // NLM input example
  //
  // <element-citation publication-type="journal" publication-format="print">
  // <name><surname>Llanos De La Torre Quiralte</surname>
  // <given-names>M</given-names></name>
  // <name><surname>Garijo Ayestaran</surname>
  // <given-names>M</given-names></name>
  // <name><surname>Poch Olive</surname>
  // <given-names>ML</given-names></name>
  // <article-title xml:lang="es">Evolucion de la mortalidad
  // infantil de La Rioja (1980-1998)</article-title>
  // <trans-title xml:lang="en">Evolution of the infant
  // mortality rate in la Rioja in Spain
  // (1980-1998)</trans-title>
  // <source>An Esp Pediatr</source>
  // <year>2001</year>
  // <month>Nov</month>
  // <volume>55</volume>
  // <issue>5</issue>
  // <fpage>413</fpage>
  // <lpage>420</lpage>
  // <comment>Figura 3, Tendencia de mortalidad infantil
  // [Figure 3, Trends in infant mortality]; p. 418.
  // Spanish</comment>
  // </element-citation>

  // TODO: is implemented naively, should be implemented considering the NLM spec
  this.citation = function(state, ref, citation) {
    var doc = state.doc;
    var citationNode;
    var i;

    var id = state.nextId("article_citation");

    // TODO: we should consider to have a more structured citation type
    // and let the view decide how to render it instead of blobbing everything here.
    var personGroup = citation.querySelector("person-group");

    // HACK: we try to create a 'articleCitation' when there is structured
    // content (ATM, when personGroup is present)
    // Otherwise we create a mixed-citation taking the plain text content of the element
    if (personGroup) {

      citationNode = {
        "id": id,
        "source_id": ref.getAttribute("id"),
        "type": "citation",
        "title": "N/A",
        "label": "",
        "authors": [],
        "doi": "",
        "source": "",
        "volume": "",
        "fpage": "",
        "lpage": "",
        "citation_urls": []
      };

      var nameElements = personGroup.querySelectorAll("name");
      for (i = 0; i < nameElements.length; i++) {
        citationNode.authors.push(this.getName(nameElements[i]));
      }

      // Consider collab elements (treat them as authors)
      var collabElements = personGroup.querySelectorAll("collab");
      for (i = 0; i < collabElements.length; i++) {
        citationNode.authors.push(collabElements[i].textContent);
      }

      var source = citation.querySelector("source");
      if (source) citationNode.source = source.textContent;

      var articleTitle = citation.querySelector("article-title");
      if (articleTitle) {
        citationNode.title = this.annotatedText(state, articleTitle, [id, 'title']);
      } else {
        var comment = citation.querySelector("comment");
        if (comment) {
          citationNode.title = this.annotatedText(state, comment, [id, 'title']);
        } else {
          // 3rd fallback -> use source
          if (source) {
            citationNode.title = this.annotatedText(state, source, [id, 'title']);
          } else {
            console.error("FIXME: this citation has no title", citation);
          }
        }
      }

      var volume = citation.querySelector("volume");
      if (volume) citationNode.volume = volume.textContent;

      var publisherLoc = citation.querySelector("publisher-loc");
      if (publisherLoc) citationNode.publisher_location = publisherLoc.textContent;

      var publisherName = citation.querySelector("publisher-name");
      if (publisherName) citationNode.publisher_name = publisherName.textContent;

      var fpage = citation.querySelector("fpage");
      if (fpage) citationNode.fpage = fpage.textContent;

      var lpage = citation.querySelector("lpage");
      if (lpage) citationNode.lpage = lpage.textContent;

      var year = citation.querySelector("year");
      if (year) citationNode.year = year.textContent;

      // Note: the label is child of 'ref'
      var label = ref.querySelector("label");
      if(label) citationNode.label = label.textContent;

      var doi = citation.querySelector("pub-id[pub-id-type='doi'], ext-link[ext-link-type='doi']");
      if(doi) citationNode.doi = "http://dx.doi.org/" + doi.textContent;
    } else {
      console.error("FIXME: there is one of those 'mixed-citation' without any structure. Skipping ...", citation);
      return;
      // citationNode = {
      //   id: id,
      //   type: "mixed_citation",
      //   citation: citation.textContent,
      //   doi: ""
      // };
    }

    doc.create(citationNode);
    doc.show("citations", id);

    return citationNode;
  };

  // Article.Back
  // --------

  this.back = function(state, back) {
    var appGroups = back.querySelectorAll('app-group');

    if (appGroups && appGroups.length > 0) {
      _.each(appGroups, function(appGroup) {
        this.appGroup(state, appGroup);
      }.bind(this));
    } else {
      // HACK: We treat <back> element as app-group, sine there
      // are docs that wrongly put <app> elements into the back
      // element directly.
      this.appGroup(state, back);
    }
  };

  this.appGroup = function(state, appGroup) {
    var apps = appGroup.querySelectorAll('app');
    var doc = state.doc;
    var title = appGroup.querySelector('title');
    if (!title) {
      console.error("FIXME: every app should have a title", this.toHtml(title));
    }

    var headingId =state.nextId("heading");
    // Insert top level element for Appendix
    var heading = doc.create({
      "type" : "heading",
      "id" : headingId,
      "level" : 1,
      "content" : title ? this.annotatedText(state, title, [headingId, "content"]) : "Appendix"
    });

    this.show(state, [heading]);
    _.each(apps, function(app) {
      state.sectionLevel = 2;
      this.app(state, app);
    }.bind(this));
  };

  this.app = function(state, app) {
    var doc = state.doc;
    var nodes = [];
    var title = app.querySelector('title');
    if (!title) {
      console.error("FIXME: every app should have a title", this.toHtml(title));
    }

    var headingId = state.nextId("heading");
    var heading = {
      "type" : "heading",
      "id" : headingId,
      "level" : 2,
      "content": title ? this.annotatedText(state, title, [headingId, "content"]) : ""
    };
    var headingNode = doc.create(heading);
    nodes.push(headingNode);

    // There may be multiple paragraphs per ack element
    var pars = this.bodyNodes(state, util.dom.getChildren(app), {
      ignore: ["title", "label", "ref-list"]
    });
    _.each(pars, function(par) {
      nodes.push(par);
    });
    this.show(state, nodes);
  };




  // Annotations
  // -----------

  this.createAnnotation = function(state, el, start, end) {
    // do not create an annotaiton if there is no range
    if (start === end) return;
    var type = el.tagName.toLowerCase();
    var anno = {
      type: "annotation",
      path: _.last(state.stack).path,
      range: [start, end],
    };
    this.addAnnotationData(state, anno, el, type);
    this.enhanceAnnotationData(state, anno, el, type);

    // assign an id after the type has been extracted to be able to create typed ids
    anno.id = state.nextId(anno.type);
    state.annotations.push(anno);
  };

  // Called for annotation types registered in this._annotationTypes
  this.addAnnotationData = function(state, anno, el, type) {
    anno.type = this._annotationTypes[type] || "annotation";
    if (type === 'xref') {
      this.addAnnotationDataForXref(state, anno, el);
    } else if (type === "ext-link" || type === "uri") {
      anno.url = el.getAttribute("xlink:href");
      // Add 'http://' to URIs without a protocol, such as 'www.google.com'
      // Except: Url starts with a slash, then we consider them relative
      var extLinkType = el.getAttribute('ext-link-type') || '';
      if ((type === "uri" || extLinkType.toLowerCase() === 'uri') && !/^\w+:\/\//.exec(anno.url) && !/^\//.exec(anno.url)) {
        anno.url = 'http://' + anno.url;
      } else if (extLinkType.toLowerCase() === 'doi') {
        anno.url = ["http://dx.doi.org/", anno.url].join("");
      }
    } else if (type === "email") {
      anno.url = "mailto:" + el.textContent.trim();
    } else if (type === 'inline-graphic') {
      anno.url = el.getAttribute("xlink:href");
    } else if (type === 'inline-formula') {
      var formula = this.formula(state, el, "inline");
      anno.target = formula.id;
    } else if (anno.type === 'custom_annotation') {
      anno.name = type;
    }
  };

  this.addAnnotationDataForXref = function(state, anno, el) {
    var refType = el.getAttribute("ref-type");
    var sourceId = el.getAttribute("rid");
    // Default reference is a cross_reference
    anno.type = this._refTypeMapping[refType] || "cross_reference";
    if (sourceId) anno.target = sourceId;
  };

  // Parse annotated text
  // --------------------
  // Make sure you call this method only for nodes where `this.isParagraphish(node) === true`
  //
  this.annotatedText = function(state, node, path, options) {
    options = options || {};
    state.stack.push({
      path: path,
      ignore: options.ignore
    });
    var childIterator = new util.dom.ChildNodeIterator(node);
    var text = this._annotatedText(state, childIterator, options);
    state.stack.pop();
    return text;
  };

  // Internal function for parsing annotated text
  // --------------------------------------------
  // As annotations are nested this is a bit more involved and meant for
  // internal use only.
  //
  this._annotatedText = function(state, iterator, options) {
    var plainText = "";

    var charPos = (options.offset === undefined) ? 0 : options.offset;
    var nested = !!options.nested;
    var breakOnUnknown = !!options.breakOnUnknown;

    while(iterator.hasNext()) {
      var el = iterator.next();
      // Plain text nodes...
      if (el.nodeType === Node.TEXT_NODE) {
        var text = state.acceptText(el.textContent);
        plainText += text;
        charPos += text.length;
      }
      // Annotations...
      else {
        var annotatedText;
        var type = util.dom.getNodeType(el);
        if (this.isAnnotation(type)) {
          if (state.top().ignore.indexOf(type) < 0) {
            var start = charPos;
            if (this._annotationTextHandler[type]) {
              annotatedText = this._annotationTextHandler[type].call(this, state, el, type, charPos);
            } else {
              annotatedText = this._getAnnotationText(state, el, type, charPos);
            }
            plainText += annotatedText;
            charPos += annotatedText.length;
            if (!state.ignoreAnnotations) {
              this.createAnnotation(state, el, start, charPos);
            }
          }
        }
        // Unsupported...
        else if (!breakOnUnknown) {
          if (state.top().ignore.indexOf(type) < 0) {
            annotatedText = this._getAnnotationText(state, el, type, charPos);
            plainText += annotatedText;
            charPos += annotatedText.length;
          }
        } else {
          if (nested) {
            console.error("Node not yet supported in annoted text: " + type);
          }
          else {
            // on paragraph level other elements can break a text block
            // we shift back the position and finish this call
            iterator.back();
            break;
          }
        }
      }
    }
    return plainText;
  };

  // A place to register handlers to override how the text of an annotation is created.
  // The default implementation is this._getAnnotationText() which extracts the plain text and creates
  // nested annotations if necessary.
  // Examples for other implementations:
  //   - links: the label of a link may be shortened in certain cases
  //   - inline elements: we model inline elements by a pair of annotation and a content node, and we create a custom label.

  this._annotationTextHandler = {};

  this._getAnnotationText = function(state, el, type, charPos) {
    // recurse into the annotation element to collect nested annotations
    // and the contained plain text
    var childIterator = new util.dom.ChildNodeIterator(el);
    var annotatedText = this._annotatedText(state, childIterator, { offset: charPos, nested: true });
    return annotatedText;
  };

  this._annotationTextHandler['ext-link'] = function(state, el, type, charPos) {
    var annotatedText = this._getAnnotationText(state, el, charPos);
    // Shorten label for URL links (i.e. if label === url )
    if (type === 'ext-link' && el.getAttribute('xlink:href') === annotatedText.trim()) {
      annotatedText = this.shortenLinkLabel(state, annotatedText);
    }
    return annotatedText;
  };

  this._annotationTextHandler['inline-formula'] = function(state) {
    return state.acceptText("{{inline-formula}}");
  };

  this.shortenLinkLabel = function(state, linkLabel) {
    var LINK_MAX_LENGTH = 50;
    var MARGIN = 10;
    // The strategy is preferably to shorten the fragment after the host part, preferring the tail.
    // If this is not possible, both parts are shortened.
    if (linkLabel.length > LINK_MAX_LENGTH) {
      var match = /((?:\w+:\/\/)?[\/]?[^\/]+[\/]?)(.*)/.exec(linkLabel);
      if (!match) {
        linkLabel = linkLabel.substring(0, LINK_MAX_LENGTH - MARGIN) + '...' + linkLabel.substring(linkLabel.length - MARGIN - 3);
      } else {
        var host = match[1] || '';
        var tail = match[2] || '';
        if (host.length > LINK_MAX_LENGTH - MARGIN) {
          linkLabel = host.substring(0, LINK_MAX_LENGTH - MARGIN) + '...' + tail.substring(tail.length - MARGIN - 3);
        } else {
          var margin = Math.max(LINK_MAX_LENGTH - host.length - 3, MARGIN - 3);
          linkLabel = host + '...' + tail.substring(tail.length - margin);
        }
      }
    }
    return linkLabel;
  };


  // Configureable methods
  // -----------------
  //

  this.getBaseURL = function(state) {
    // Use xml:base attribute if present
    var baseURL = state.xmlDoc.querySelector("article").getAttribute("xml:base");
    return baseURL || state.options.baseURL;
  };

  this.enhanceArticle = function(state, article) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  this.enhanceCover = function(state, node, element) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  // Implements resolving of relative urls
  this.enhanceFigure = function(state, node, element) {
    var graphic = element.querySelector("graphic");
    var url = graphic.getAttribute("xlink:href");
    node.url = this.resolveURL(state, url);
  };

  this.enhancePublicationInfo = function(converter, state, article) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  this.enhanceSupplement = function(state, node, element) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  this.enhanceTable = function(state, node, element) {
    /* jshint unused:false */
    // Noop - override in custom converter
  };

  // Default video resolver
  // --------
  //

  this.enhanceVideo = function(state, node, element) {
    // xlink:href example: elife00778v001.mov

    var url = element.getAttribute("xlink:href");
    var name;
    // Just return absolute urls
    if (url.match(/http:/)) {
      var lastdotIdx = url.lastIndexOf(".");
      name = url.substring(0, lastdotIdx);
      node.url = name+".mp4";
      node.url_ogv = name+".ogv";
      node.url_webm = name+".webm";
      node.poster = name+".png";
      return;
    } else {
      var baseURL = this.getBaseURL(state);
      name = url.split(".")[0];
      node.url = baseURL+name+".mp4";
      node.url_ogv = baseURL+name+".ogv";
      node.url_webm = baseURL+name+".webm";
      node.poster = baseURL+name+".png";
    }
  };

  // Default figure url resolver
  // --------
  //
  // For relative urls it uses the same basebath as the source XML

  this.resolveURL = function(state, url) {
    // Just return absolute urls
    if (url.match(/http:/)) return url;
    return [
      state.options.baseURL,
      url
    ].join('');
  };

  this.viewMapping = {
    // "image": "figures",
    "box": "content",
    "supplement": "figures",
    "figure": "figures",
    "html_table": "figures",
    "video": "figures"
  };

  this.enhanceAnnotationData = function(state, anno, element, type) {
    /* jshint unused:false */
  };

  this.showNode = function(state, node) {
    var view = this.viewMapping[node.type] || "content";
    state.doc.show(view, node.id);
  };

};

NlmToLensConverter.State = function(converter, xmlDoc, doc) {
  var self = this;

  // the input xml document
  this.xmlDoc = xmlDoc;

  // the output substance document
  this.doc = doc;

  // keep track of the options
  this.options = converter.options;

  // this.config = new DefaultConfiguration();

  // store annotations to be created here
  // they will be added to the document when everything else is in place
  this.annotations = [];

  // when recursing into sub-nodes it is necessary to keep the stack
  // of processed nodes to be able to associate other things (e.g., annotations) correctly.
  this.stack = [];

  this.sectionLevel = 1;

  // Tracks all available affiliations
  this.affiliations = [];

  // an id generator for different types
  var ids = {};
  this.nextId = function(type) {
    ids[type] = ids[type] || 0;
    ids[type]++;
    return type +"_"+ids[type];
  };

  // store ids here which have been processed already
  this.used = {};

  // Note: it happens that some XML files are edited without considering the meaning of whitespaces
  // to increase readability.
  // This *hack* eliminates multiple whitespaces at the begin and end of textish elements.
  // Tabs and New Lines are eliminated completely. So with this, the preferred way to prettify your XML
  // is to use Tabuators and New Lines. At the same time, it is not possible anymore to have soft breaks within
  // a text.

  var WS_LEFT = /^\s+/g;
  var WS_LEFT_ALL = /^\s*/g;
  var WS_RIGHT = /\s+$/g;
   var WS_ALL = /\s+/g;
  // var ALL_WS_NOTSPACE_LEFT = /^[\t\n]+/g;
  // var ALL_WS_NOTSPACE_RIGHT = /[\t\n]+$/g;
  var SPACE = " ";
  var TABS_OR_NL = /[\t\n\r]+/g;

  this.lastChar = "";
  this.skipWS = false;

  this.acceptText = function(text) {
    if (!this.options.TRIM_WHITESPACES) {
      return text;
    }

    // EXPERIMENTAL: drop all 'formatting' white-spaces (e.g., tabs and new lines)
    // (instead of doing so only at the left and right end)
    //text = text.replace(ALL_WS_NOTSPACE_LEFT, "");
    //text = text.replace(ALL_WS_NOTSPACE_RIGHT, "");
    text = text.replace(TABS_OR_NL, "");

    if (this.lastChar === SPACE || this.skipWS) {
      text = text.replace(WS_LEFT_ALL, "");
    } else {
      text = text.replace(WS_LEFT, SPACE);
    }
    // this state is only kept for one call
    this.skipWS = false;

    text = text.replace(WS_RIGHT, SPACE);

    // EXPERIMENTAL: also remove white-space within
    if (this.options.REMOVE_INNER_WS) {
      text = text.replace(WS_ALL, SPACE);
    }

    this.lastChar = text[text.length-1] || this.lastChar;
    return text;
  };

  this.top = function() {
    var top = _.last(self.stack);
    top = top || {};
    top.ignore = top.ignore || [];
    return top;
  };
};

NlmToLensConverter.prototype = new NlmToLensConverter.Prototype();
NlmToLensConverter.prototype.constructor = NlmToLensConverter;

// NlmToLensConverter.DefaultConfiguration = DefaultConfiguration;

NlmToLensConverter.DefaultOptions = {
  TRIM_WHITESPACES: true,
  REMOVE_INNER_WS: true
};

module.exports = NlmToLensConverter;
