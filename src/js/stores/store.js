    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    import { yellow, green, brown, purple, white, black } from 'values/colors';
    import * as Sizes from 'values/sizes';
    const __MODULE__ = Kernel.SpecialForms.atom('Store');
    let graphics = Patterns.defmatch(Patterns.make_case([Patterns.variable(), {
        type: Kernel.SpecialForms.atom('addPoint'),     point: {
        x: Patterns.variable(),     y: Patterns.variable(),     dragging: Patterns.variable()
  }
  }],function(state,x,y,dragging)    {
        return     Kernel.SpecialForms.map_update(state,{
        clickX: JS.get_property_or_call_function(state,'clickX').concat(Kernel.SpecialForms.list(x)),     clickY: JS.get_property_or_call_function(state,'clickY').concat(Kernel.SpecialForms.list(y)),     clickDrag: JS.get_property_or_call_function(state,'clickDrag').concat(Kernel.SpecialForms.list(dragging)),     clickSize: JS.get_property_or_call_function(state,'clickSize').concat(Kernel.SpecialForms.list(JS.get_property_or_call_function(state,'currentSize'))),     clickColor: JS.get_property_or_call_function(state,'clickColor').concat(Kernel.SpecialForms.list(JS.get_property_or_call_function(state,'currentColor')))
  });
      }),Patterns.make_case([Patterns.variable(), {
        type: Kernel.SpecialForms.atom('changeColor'),     color: Patterns.variable()
  }],function(state,color)    {
        return     Kernel.SpecialForms.map_update(state,{
        currentColor: color
  });
      }),Patterns.make_case([Patterns.variable(), {
        type: Kernel.SpecialForms.atom('changeSize'),     size: Patterns.variable()
  }],function(state,size)    {
        return     Kernel.SpecialForms.map_update(state,{
        currentSize: size
  });
      }),Patterns.make_case([Patterns.variable(), {
        type: Kernel.SpecialForms.atom('startPainting')
  }],function(state)    {
        return     Kernel.SpecialForms.map_update(state,{
        paint: true
  });
      }),Patterns.make_case([Patterns.variable(), {
        type: Kernel.SpecialForms.atom('stopPainting')
  }],function(state)    {
        return     Kernel.SpecialForms.map_update(state,{
        paint: false
  });
      }));
    let subscribe = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(sub_fn)    {
        return     Agent.update(__MODULE__,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
        return     Kernel.SpecialForms.map_update(x,{
        subscribers: JS.get_property_or_call_function(x,'subscribers').concat(Kernel.SpecialForms.list(sub_fn))
  });
      })));
      }));
    let init = Patterns.defmatch(Patterns.make_case([],function()    {
        return     Agent.start(Patterns.defmatch(Patterns.make_case([],function()    {
        return     Kernel.SpecialForms.map({
        subscribers: Kernel.SpecialForms.list(),     state: Kernel.SpecialForms.map({
        paint: false,     clickX: Kernel.SpecialForms.list(),     clickY: Kernel.SpecialForms.list(),     clickDrag: Kernel.SpecialForms.list(),     clickColor: Kernel.SpecialForms.list(),     clickSize: Kernel.SpecialForms.list(),     clickTool: Kernel.SpecialForms.list(),     currentColor: black(),     currentSize: JS.get_property_or_call_function(Sizes,'small')
  })
  });
      })),Kernel.SpecialForms.list(Kernel.SpecialForms.tuple(Kernel.SpecialForms.atom('name'),__MODULE__)));
      }));
    let get = Patterns.defmatch(Patterns.make_case([],function()    {
        return     Agent.get(__MODULE__,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
        return     JS.get_property_or_call_function(x,'state');
      })));
      }));
    let dispatch = Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(action)    {
        Agent.update(__MODULE__,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
        return     Kernel.SpecialForms.map_update(x,{
        state: graphics(JS.get_property_or_call_function(x,'state'),action)
  });
      })));
        let [subscribers0] = Patterns.match(Patterns.variable(),Agent.get(__MODULE__,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
        return     JS.get_property_or_call_function(x,'subscribers');
      }))));
        return     Enum.each(subscribers0,Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(sub_fn)    {
        return     sub_fn();
      })));
      }));
    export {
        subscribe,     init,     get,     dispatch
  };