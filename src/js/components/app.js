    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    import { default as React } from 'react';
    import * as Layout from 'components/layout';
    const __MODULE__ = Kernel.SpecialForms.atom('App');
    let start = Patterns.defmatch(Patterns.make_case([],function()    {
        return     React.render(React.createElement(JS.get_property_or_call_function(Layout,'create_class')),document.getElementById('main'));
      }));
    export {
        start
  };