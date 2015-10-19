    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    import * as ReactApp from 'components/app';
    import * as Store from 'stores/store';
    const __MODULE__ = Kernel.SpecialForms.atom('App');
    let main = Patterns.defmatch(Patterns.make_case([],function()    {
        JS.get_property_or_call_function(Store,'init');
        return     JS.get_property_or_call_function(ReactApp,'start');
      }));
    main();
    export {
        main
  };