var Lens = {
  Controller: require("./src/lens_controller"),
  View: require("./src/lens_view"),
  Reader: {
    Controller: require("./src/reader_controller"),
    View: require("./src/reader_view"),
    PanelFactory: require("./src/panel_factory"),
    defaultPanels: require("./src/panel_specification")
  }
};

module.exports = Lens;