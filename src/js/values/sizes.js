    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    const __MODULE__ = Kernel.SpecialForms.atom('Sizes');
    let medium = Patterns.defmatch(Patterns.make_case([],function()    {
        return     5;
      }));
    let large = Patterns.defmatch(Patterns.make_case([],function()    {
        return     8;
      }));
    let small = Patterns.defmatch(Patterns.make_case([],function()    {
        return     2;
      }));
    export {
        medium,     large,     small
  };