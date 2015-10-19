    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    import * as Store from 'stores/store';
    import { default as React } from 'react';
    import { yellow, green, brown, purple, white, black } from 'values/colors';
    import * as Graphic from 'components/graphic';
    import { medium, large, small } from 'values/sizes';
    const __MODULE__ = Kernel.SpecialForms.atom('Layout');
    let create_class = Patterns.defmatch(Patterns.make_case([],function()    {
        return     React.createClass(Kernel.SpecialForms.map({
        displayName: 'Layout',     getInitialState: Patterns.defmatch(Patterns.make_case([],function()    {
        return     Kernel.SpecialForms.map({});
      })),     render: Patterns.defmatch(Patterns.make_case([],function()    {
        return     React.DOM.div(Kernel.SpecialForms.map({}),React.DOM.div(Kernel.SpecialForms.map({
        className: 'toolArea'
  }),React.DOM.span(Kernel.SpecialForms.map({
        className: 'toolTitle'
  }),null,'Sizes'),React.DOM.button(Kernel.SpecialForms.map({
        className: 'toolButton',     onClick: Patterns.defmatch(Patterns.make_case([Patterns.wildcard(), Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('changeSize'),     size: small()
  }));
      }))
  }),null,'Small'),React.DOM.button(Kernel.SpecialForms.map({
        className: 'toolButton',     onClick: Patterns.defmatch(Patterns.make_case([Patterns.wildcard(), Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('changeSize'),     size: medium()
  }));
      }))
  }),null,'Medium'),React.DOM.button(Kernel.SpecialForms.map({
        className: 'toolButton',     onClick: Patterns.defmatch(Patterns.make_case([Patterns.wildcard(), Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('changeSize'),     size: large()
  }));
      }))
  }),null,'Large')),React.DOM.div(Kernel.SpecialForms.map({
        className: 'toolArea'
  }),React.DOM.span(Kernel.SpecialForms.map({
        className: 'toolTitle'
  }),null,'Colors'),React.DOM.button(Kernel.SpecialForms.map({
        className: 'toolButton',     onClick: Patterns.defmatch(Patterns.make_case([Patterns.wildcard(), Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('changeColor'),     color: black()
  }));
      }))
  }),null,'Black'),React.DOM.button(Kernel.SpecialForms.map({
        className: 'toolButton',     onClick: Patterns.defmatch(Patterns.make_case([Patterns.wildcard(), Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('changeColor'),     color: purple()
  }));
      }))
  }),null,'Purple'),React.DOM.button(Kernel.SpecialForms.map({
        className: 'toolButton',     onClick: Patterns.defmatch(Patterns.make_case([Patterns.wildcard(), Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('changeColor'),     color: green()
  }));
      }))
  }),null,'Green')),React.createElement(JS.get_property_or_call_function(Graphic,'create_class')));
      }))
  }));
      }));
    export {
        create_class
  };