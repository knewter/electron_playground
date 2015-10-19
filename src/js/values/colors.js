    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    const __MODULE__ = Kernel.SpecialForms.atom('Colors');
    let yellow = Patterns.defmatch(Patterns.make_case([],function()    {
        return     '#ffcf33';
      }));
    let green = Patterns.defmatch(Patterns.make_case([],function()    {
        return     '#659b41';
      }));
    let brown = Patterns.defmatch(Patterns.make_case([],function()    {
        return     '#986928';
      }));
    let purple = Patterns.defmatch(Patterns.make_case([],function()    {
        return     '#cb3594';
      }));
    let white = Patterns.defmatch(Patterns.make_case([],function()    {
        return     '#FFFFFF';
      }));
    let black = Patterns.defmatch(Patterns.make_case([],function()    {
        return     '#000000';
      }));
    export {
        yellow,     green,     brown,     purple,     white,     black
  };