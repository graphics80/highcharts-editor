/******************************************************************************

Copyright (c) 2016, Highsoft

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

******************************************************************************/

highed.Editor = function (parent) {
	var events = highed.events(),
		customizedOptions = {},
		exports = {
			customizedOptions: customizedOptions,
			flatOptions: {}
		},

		container = highed.dom.cr('div', 'highed-container'),
		titlebar = highed.dom.cr('div', 'titlebar'),
		titleLabel = highed.dom.cr('span', '', ''),

		mainToolbar = highed.Toolbar(container, {
			additionalCSS: ['highed-header']
		}),
		
		titlebarIcons = highed.dom.cr('div', 'icons'),

		settingsBtn = highed.dom.cr('div', 'settings highed-icon fa fa-gear'),
		fullscreenBtn = highed.dom.cr('div', 'settings highed-icon fa fa-desktop'),
		resetOptionsBtn = highed.dom.cr('div', 'settings highed-icon fa fa-file-o')

		splitter = highed.HSplitter(container, {leftWidth: 60}),
		tabControl = highed.TabControl(splitter.left),
	
		chartTemplateTab = tabControl.createTab({title: 'CHART'}),
		customizeTab = tabControl.createTab({title: 'CUSTOMIZE'}),

		chartTemplateSelector = highed.ChartTemplateSelector(chartTemplateTab.body),
		chartContainer = highed.dom.cr('div', 'highed-box-size'),

		chartCustomizer = highed.ChartCustomizer(customizeTab.body, exports),

		chart = new Highcharts.Chart({
			chart: {
				type: 'bar',
				renderTo: chartContainer				
			},
			xAxis: {
		        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
		            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
		    },

		    series: [{
		        data: [29.9, 71.5, 106.4, 129.2, 144.0, 176.0, 135.6, 148.5, 216.4, 194.1, 95.6, 54.4]
		    }]

		}),

		cleanOptions = highed.merge({}, chart.options),

		wizbar = highed.WizardBar(container, undefined)
	;

	///////////////////////////////////////////////////////////////////////////
	
	/* Resize the editor */
	function resize() {
		var cs = highed.dom.size(container),
			ms = highed.dom.size(mainToolbar.container),
			wb = highed.dom.size(wizbar.container)
		;

		chartCustomizer.resize();
		tabControl.resize();
		chartTemplateSelector.resize(undefined, cs.h - ms.h - wb.h);
		splitter.resize(cs.w, cs.h - ms.h - wb.h);
		events.emit('Resized');
	}

	///////////////////////////////////////////////////////////////////////////

	//Handle settings click
	highed.dom.on(settingsBtn, 'click', highed.showSettings);

	//Attach to parent node
	parent = highed.dom.get(parent);
	if (parent) {
		highed.dom.ap(parent, 
			container							
		);

		highed.dom.ap(splitter.right, 
			highed.dom.ap(titlebar,
				titleLabel
			),
			chartContainer
		);

		highed.dom.ap(mainToolbar.left,
			highed.dom.cr('div', 'highed-logo')
		);

		highed.dom.ap(mainToolbar.right, 
			fullscreenBtn,
					resetOptionsBtn,
					settingsBtn
		);

		resize();
	} else {
		highed.log(1, 'no valid parent supplied to editor');
	}

	///////////////////////////////////////////////////////////////////////////
	
	//Handle chart template selection
	chartTemplateSelector.on('Select', function (template) {
		//Need to apply template.config to the chart.
		//This is sort of silly, fix later - there may be a way in the API
		//to reset the options without recreating the whole thing.
		//Modifying chart.options and doing chart.redraw did not work however.

		var options = highed.merge(highed.merge({}, cleanOptions), customizedOptions);

		Object.keys(template.config).forEach(function (key) {
			highed.setAttr(options, key, template.config[key]);
			exports.flatOptions[key] = template.config[key];
		});

		console.log(options);		
		options.chart.renderTo = chartContainer;
		chart = new Highcharts.Chart(options);
		resize();
		//chart.redraw();
		//chart.reflow();
	});

	//Handle property change
	chartCustomizer.on('PropertyChange', function (id, value) {
		highed.setAttr(chart.options, id, value);
		highed.setAttr(customizedOptions, id, value);
		highed.setAttr(chart.options, 'plotOptions--series--animation', false);

		exports.flatOptions[id] = value;

		chart = new Highcharts.Chart(chart.options);
		resize();
	});

	///////////////////////////////////////////////////////////////////////////

	//Public interface
 
	/* Attach an event listener
	 * @event - the event to listen for
	 * @callback - the callback to execute when the event is emitted
	 * @context (optional) - the value of the this reference in the callback
	 *
	 * @returns a function that can be called to unbind the listener
	 */
	exports.on = events.on;
	/* Force a resize of the editor */
	exports.resize = resize;
	
	return exports;
};