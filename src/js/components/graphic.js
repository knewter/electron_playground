    import { Patterns, Kernel, Atom, Enum, Integer, JS, List, Range, Tuple, Agent, Keyword, BitString } from 'elixir';
    import { default as React } from 'react';
    import * as Store from 'stores/store';
    const __MODULE__ = Kernel.SpecialForms.atom('Graphic');
    let create_class = Patterns.defmatch(Patterns.make_case([],function()    {
        return     React.createClass(Kernel.SpecialForms.map({
        getInitialState: Patterns.defmatch(Patterns.make_case([],function()    {
        return     null;
      })),     getRawCanvas: Patterns.defmatch(Patterns.make_case([],function()    {
        return     React.findDOMNode(this);
      })),     getContext: Patterns.defmatch(Patterns.make_case([],function()    {
        return     JS.get_property_or_call_function(this,'getRawCanvas').getContext('2d');
      })),     componentDidMount: Patterns.defmatch(Patterns.make_case([],function()    {
        let [outerScope00] = Patterns.match(Patterns.variable(),this);
        return     Store.subscribe(Patterns.defmatch(Patterns.make_case([],function()    {
        return     outerScope00.paint(JS.get_property_or_call_function(Store,'get'),JS.get_property_or_call_function(outerScope00,'getContext'));
      })));
      })),     paint: Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(data,context)    {
        context.clearRect(0,0,JS.get_property_or_call_function(JS.get_property_or_call_function(context,'canvas'),'width'),JS.get_property_or_call_function(JS.get_property_or_call_function(context,'canvas'),'height'));
        JS.get_property_or_call_function(context,'save');
        context['lineJoin'] = 'round'
        Enum.map_reduce(JS.get_property_or_call_function(data,'clickX'),0,Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.variable()],function(x,i)    {
        JS.get_property_or_call_function(context,'beginPath');
        Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
        return     context.moveTo(JS.get_property_or_call_function(data,'clickX')[i] - 1,JS.get_property_or_call_function(data,'clickY')[i]);
      },function(x)    {
        return     Kernel.__in__(x,Kernel.SpecialForms.list(false,null));
      }),Patterns.make_case([Patterns.wildcard()],function()    {
        return     context.moveTo(JS.get_property_or_call_function(data,'clickX')[i - 1],JS.get_property_or_call_function(data,'clickY')[i - 1]);
      })).call(this,data['clickDrag'][i] && i);
        context.lineTo(JS.get_property_or_call_function(data,'clickX')[i],JS.get_property_or_call_function(data,'clickY')[i]);
        JS.get_property_or_call_function(context,'closePath');
        context['strokeStyle'] = JS.get_property_or_call_function(data,'clickColor')[i]
        context['lineWidth'] = JS.get_property_or_call_function(data,'clickSize')[i]
        JS.get_property_or_call_function(context,'stroke');
        return     Kernel.SpecialForms.tuple(null,i + 1);
      })));
        context['globalAlpha'] = 1
        return     JS.get_property_or_call_function(context,'restore');
      })),     onMouseMoveHandler: Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.wildcard()],function(event)    {
        let [canvas00] = Patterns.match(Patterns.variable(),JS.get_property_or_call_function(this,'getRawCanvas'));
        let [mouseX00] = Patterns.match(Patterns.variable(),JS.get_property_or_call_function(event,'pageX') - JS.get_property_or_call_function(canvas00,'offsetLeft'));
        let [mouseY00] = Patterns.match(Patterns.variable(),JS.get_property_or_call_function(event,'pageY') - JS.get_property_or_call_function(canvas00,'offsetTop'));
        return     Patterns.defmatch(Patterns.make_case([Patterns.variable()],function(x)    {
        return     null;
      },function(x)    {
        return     Kernel.__in__(x,Kernel.SpecialForms.list(false,null));
      }),Patterns.make_case([Patterns.wildcard()],function()    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('addPoint'),     point: Kernel.SpecialForms.map({
        x: mouseX00,     y: mouseY00,     dragging: true
  })
  }));
      })).call(this,JS.get_property_or_call_function(JS.get_property_or_call_function(Store,'get'),'paint'));
      })),     onMouseDownHandler: Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.wildcard()],function(event)    {
        let [canvas10] = Patterns.match(Patterns.variable(),JS.get_property_or_call_function(this,'getRawCanvas'));
        let [mouseX10] = Patterns.match(Patterns.variable(),JS.get_property_or_call_function(event,'pageX') - JS.get_property_or_call_function(canvas10,'offsetLeft'));
        let [mouseY10] = Patterns.match(Patterns.variable(),JS.get_property_or_call_function(event,'pageY') - JS.get_property_or_call_function(canvas10,'offsetTop'));
        Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('startPainting')
  }));
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('addPoint'),     point: Kernel.SpecialForms.map({
        x: mouseX10,     y: mouseY10,     dragging: false
  })
  }));
      })),     onMouseUpHandler: Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.wildcard()],function(event)    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('stopPainting')
  }));
      })),     onMouseLeaveHandler: Patterns.defmatch(Patterns.make_case([Patterns.variable(), Patterns.wildcard()],function(event)    {
        return     Store.dispatch(Kernel.SpecialForms.map({
        type: Kernel.SpecialForms.atom('stopPainting')
  }));
      })),     render: Patterns.defmatch(Patterns.make_case([],function()    {
        return     React.DOM.canvas(Kernel.SpecialForms.map({
        className: 'drawingArea',     width: 800,     height: 600,     onMouseDown: this['onMouseDownHandler'],     onMouseMove: this['onMouseMoveHandler'],     onMouseUp: this['onMouseUpHandler'],     onMouseLeave: this['onMouseLeaveHandler']
  }));
      }))
  }));
      }));
    export {
        create_class
  };