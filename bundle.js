
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    let eventid = 1381;

    const basePath = window.location.origin;
    const navbarlinks = [
      // Name of Link, Hyperlink, Target(self=>same window, blank=>new tab)
      ["Home", `${basePath}/`, "_self"],
      ["About The Congress", `${basePath}/about`, "_self"],
      ["Accomodation", `${basePath}/accomodation`, "_self"],
      ["Registration Fees", `${basePath}/registrationfees`, "_blank"],
      // ["Contact", `${basePath}/#contact`, "_self"],
      // ["Submit", `${basePath}/submit`, "_self"]
    ];

    const topbuttons = [
      // { label: "3rd to 5th of October 2024", url: "#date" },
      { label: "Registration",       label2:"Opening 01.12.2024",        url: "https://www.congress-compact.de/veranstaltungskalender?anmeldung=" + eventid },
      { label: "Abstract Submission",label2:" Opening 15.01.2024",        url: "/submit"},
      { label: "Programme Overview",    url: "/programme" }
    ];


    const topics = [
      "Health monitoring and health promotion — data for action",
      "Early childhood interventions — community networking",
      "Mental health and well-being",
      "Special education and health care for children with chronic conditions",
      "Inclusion of children with chronic health conditions in schools: collaboration of the health and education sector",
      "Health promotion efforts at universities",
      "Qualification of school doctors and school nurses",
      "Improving public health action in educational settings by enhancing networking"
    ];

    const objectives = [
      "Exchange of Evidence",
      "Exchange of Experiences",
      "Showcase Best Practices"
    ];

    const euscolors = [
      'rgb(23, 207, 100)',
      '#F29B74',
      '#F3FB34',
      // darker shades
      'rgb(0, 129, 54)',
    ];


    const interactiveRooms = writable([
      "Health Monitoring and Health Promotion - Data for Action",
      "Early Childhood and Early Support",
      "Inclusion of Children with Chronic Health Conditions in Schools: Collaboration Between the Education and Health Sector",
      "Special Education and Health Care for Children with Chronic conditions",
      "Mental Health and Wellbeing in Adolescents and\u00A0Students",
      "School Absenteeism – Cooperation Needs between the Educational and Health Sector",
      "Health Promotion Projects in Schools – Sharing Experience on the Ground",
      "School Health Services in Europe: Guidelines, Researches, Challenges",
      "Health Promotion in Students at Universities",
      "Qualification of School Doctors and School Nurses - Guidelines, Curricula",
    ]);

    const hottopics = writable ([
      "Sustainable Health in Children and Students – Reduce the Gap!",
      "Bridging Health and Education Gaps: Lessons Learnt!",
      "Digital World and Impact on Children’s and Adolescents’ Wellbeing",
      "Data for Action: Monitoring Health in Children, Adolescents and\u00A0Students",
      "Intersectoral Interventions: Public Health on Site",
      "School Nurses and Networking",
      "Improving HPV Vaccination in Europe",
      "Vision and Hearing Screening",
      "Sexuality, Diversity, Puberty",
      "Inclusion of Children with Chronic Health Conditions: Models of Good Practice",
      ]);

    const eventSchedule = writable({
    // export const eventSchedule = {
      'Thursday': [
        {
          startTime: 'from',
          endTime: '1:00',
          event: 'Welcome Reception'
        },

        {
          startTime: '2:00',
          endTime: '3:30',
          event: 'Opening Session'
        },
        {
          startTime: '3:30',
          endTime: '4:00',
          event: 'Coffee Break'
        },
        {
          startTime: '4:00',
          endTime: '6:00',
          event: 'Plenary Session',
          plenary: true,
        },
        {
          startTime: '4:00',
          endTime: '5:30',
          event: 'Sustainable Health in Children and Students – Reduce the Gap!',
          plenary: true,
        },
        {
          startTime: '5:30',
          endTime: '6:00',
          event: 'Panel Discussion: Lessons Learnt for Acting on the Ground',
          plenary: true,
        },
        {
          startTime: '6:00',
          endTime: '7:00',
          event: 'Break'
        },
        {
          startTime: '7:00',
          endTime: '9:00',
          event: 'Get Together' // Reithalle Schiffsbauergasse'
        }
      ],
      'Friday': [
        {
          startTime: '8:00',
          endTime: '9:00',
          event: 'Pitch Poster Presentations'
        },
        {
          startTime: '9:00',
          endTime: '9:30',
          event: 'Coffee Break'
        },
        {
          startTime: '9:30',
          endTime: '11:00',
          subevent:'Parallel Sessions',
          event: [
            'Data for Action Monitoring Health in\u00A0Children, Adolescents and\u00A0Students',
            'Intersectoral Interventions: Public\u00A0Health on Site',
            'School Nurses and Networking (GE)'
          ]
        },
        {
          startTime: '11:00',
          endTime: '11:30',
          event: 'Coffee Break'
        },
        {
          startTime: '11:30',
          endTime: '1:00',
          subevent: '10 Interactive Rooms  ',
          event: 'Bridging Health and Education Gaps: Lessons Learnt!',
        },
        {
          startTime: '1:00',
          endTime: '2:00',
          event: 'Lunch Break'
        },
        {
          startTime: '1:00',
          endTime: '1:45',
          subevent: "Pharma Symposium",
          event: [
            'Improving HPV Vaccination in Europe',
            'Vision and Hearing Screening'
          ]
        },
        {
          startTime: '2:00',
          endTime: '3:30',
          subevent: 'Plenary Session',
          event: 'Digital World and Impact on Children’s and Adolescents’ Wellbeing',
          plenary: true,
        },
        {
          startTime: '3:30',
          endTime: '4:00',
          event: 'Coffee Break'
        },
        {
          startTime: '4:00',
          endTime: '5:30',
          subevent: '10 Interactive Rooms  ',
          event: 'Sharing Experience - Take Away Messages'
        },
        {
          startTime: '5:45',
          endTime: '7:00',
          event: 'General Assembly'
        },
        {
          startTime: '8:00',
          endTime: '11:00',
          event: 'Gala Dinner',
        },
      ],
      'Saturday': [
        {
          startTime: '8:00',
          endTime: '9:30',
          subevent: 'Early Bird Pharma Symposium',
          event: ['ADHD', 'New Vaccines']
        },
        {
          startTime: '9:30',
          endTime: '10:00',
          event: 'Coffee Break'
        },
        {
          startTime: '10:00',
          endTime: '11:30',
          subevent: 'Parallel Sessions',
          event: ['Inclusion of Children with Chronic Health Conditions: Models of Good Practice', 'Sexuality, Diversity, Puberty']
        },
        {
          startTime: '11:30',
          endTime: '12:00',
          event: 'Coffee Break'
        },
        {
          startTime: '12:00',
          endTime: '1:15',
          event: 'Lessons Learnt to Reduce the Health and Educational Gap in Children and Students - Moderators\u00A0Wrap\u00A0Up',
          subevent: 'Plenary Session',
          plenary: true,
        },
        {
          startTime: '1:15',
          endTime: '1:30',
          event: 'Coffee Break'
        },
        {
          startTime: '1:30',
          endTime: '2:30',
          event: 'Think Globally, Act Locally',
          subevent: 'Closing Session',
        },
        {
          startTime: '2:30',
          endTime: '3:00', // Or some other arbitrary close time, just to signify the end
          event: 'Farewell'
        }
      ]
    });

    /* src\Navbar.svelte generated by Svelte v3.59.2 */
    const file$a = "src\\Navbar.svelte";

    function get_each_context$7(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i][0];
    	child_ctx[1] = list[i][1];
    	child_ctx[2] = list[i][2];
    	return child_ctx;
    }

    function get_each_context_1$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i][0];
    	child_ctx[1] = list[i][1];
    	child_ctx[2] = list[i][2];
    	return child_ctx;
    }

    // (35:8) {#each navbarlinks as [text, url, target]}
    function create_each_block_1$4(ctx) {
    	let li;
    	let a;
    	let t_value = /*text*/ ctx[0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "eus-text-50");
    			attr_dev(a, "href", /*url*/ ctx[1]);
    			attr_dev(a, "target", /*target*/ ctx[2]);
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$a, 35, 16, 1262);
    			add_location(li, file$a, 35, 12, 1258);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$4.name,
    		type: "each",
    		source: "(35:8) {#each navbarlinks as [text, url, target]}",
    		ctx
    	});

    	return block;
    }

    // (55:10) {#each navbarlinks as [text, url, target]}
    function create_each_block$7(ctx) {
    	let li;
    	let a;
    	let t_value = /*text*/ ctx[0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "href", /*url*/ ctx[1]);
    			attr_dev(a, "target", /*target*/ ctx[2]);
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$a, 55, 16, 2013);
    			add_location(li, file$a, 55, 12, 2009);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$7.name,
    		type: "each",
    		source: "(55:10) {#each navbarlinks as [text, url, target]}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let a0;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let div1;
    	let nav0;
    	let div0;
    	let a1;
    	let span;
    	let t1;
    	let div3;
    	let div2;
    	let ul0;
    	let t2;
    	let div6;
    	let nav1;
    	let div4;
    	let a2;
    	let img1;
    	let img1_src_value;
    	let t3;
    	let div5;
    	let ul1;
    	let t4;
    	let div7;
    	let each_value_1 = navbarlinks;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$4(get_each_context_1$4(ctx, each_value_1, i));
    	}

    	let each_value = navbarlinks;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$7(get_each_context$7(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			a0 = element("a");
    			img0 = element("img");
    			t0 = space();
    			div1 = element("div");
    			nav0 = element("nav");
    			div0 = element("div");
    			a1 = element("a");
    			span = element("span");
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div6 = element("div");
    			nav1 = element("nav");
    			div4 = element("div");
    			a2 = element("a");
    			img1 = element("img");
    			t3 = space();
    			div5 = element("div");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div7 = element("div");
    			if (!src_url_equal(img0.src, img0_src_value = "./img/eusuhm_logo.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Logo");
    			add_location(img0, file$a, 10, 4, 312);
    			attr_dev(a0, "href", ".");
    			attr_dev(a0, "id", "eus-sticky-logo");
    			add_location(a0, file$a, 9, 0, 273);
    			attr_dev(span, "uk-icon", "icon: navbar-toggle-icon; ratio: 1.5");
    			add_location(span, file$a, 23, 16, 888);
    			attr_dev(a1, "class", "uk-text-success uk-navbar-toggle uk-hidden@m");
    			attr_dev(a1, "href", "/");
    			attr_dev(a1, "uk-toggle", "target: #offcanvas-nav");
    			add_location(a1, file$a, 22, 12, 770);
    			attr_dev(div0, "class", "uk-navbar-right uk-padding uk-padding-remove-top uk-padding-remove-bottom");
    			add_location(div0, file$a, 21, 8, 669);
    			attr_dev(nav0, "class", "uk-navbar-container");
    			attr_dev(nav0, "uk-navbar", "");
    			add_location(nav0, file$a, 16, 4, 565);
    			attr_dev(div1, "uk-sticky", "sel-target: .uk-navbar-container; cls-active: uk-navbar-sticky uk-navbar-transparent uk-hidden@m");
    			add_location(div1, file$a, 15, 0, 445);
    			attr_dev(ul0, "class", "uk-nav uk-nav-default");
    			add_location(ul0, file$a, 33, 8, 1158);
    			attr_dev(div2, "class", "uk-offcanvas-bar");
    			add_location(div2, file$a, 32, 4, 1118);
    			attr_dev(div3, "id", "offcanvas-nav");
    			attr_dev(div3, "uk-offcanvas", "mode:slide; overlay:true; flip:true");
    			add_location(div3, file$a, 31, 0, 1037);
    			if (!src_url_equal(img1.src, img1_src_value = "img/eusuhm_logo_text.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Logo");
    			add_location(img1, file$a, 48, 10, 1780);
    			attr_dev(a2, "href", "/");
    			add_location(a2, file$a, 47, 8, 1756);
    			attr_dev(div4, "class", "eus-logo-text uk-navbar-left uk-padding uk-padding-remove-top uk-padding-remove-bottom");
    			add_location(div4, file$a, 46, 6, 1646);
    			attr_dev(ul1, "class", "uk-navbar-nav");
    			add_location(ul1, file$a, 53, 8, 1915);
    			attr_dev(div5, "class", "uk-navbar-right");
    			add_location(div5, file$a, 52, 6, 1876);
    			attr_dev(nav1, "class", "uk-navbar-container uk-navbar-transparent uk-padding-large uk-padding-remove-top uk-padding-remove-bottom");
    			attr_dev(nav1, "uk-navbar", "");
    			add_location(nav1, file$a, 43, 4, 1455);
    			attr_dev(div6, "class", "uk-visible@m");
    			add_location(div6, file$a, 42, 0, 1423);
    			attr_dev(div7, "class", "uk-padding");
    			add_location(div7, file$a, 64, 2, 2172);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a0, anchor);
    			append_dev(a0, img0);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, nav0);
    			append_dev(nav0, div0);
    			append_dev(div0, a1);
    			append_dev(a1, span);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(ul0, null);
    				}
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, div6, anchor);
    			append_dev(div6, nav1);
    			append_dev(nav1, div4);
    			append_dev(div4, a2);
    			append_dev(a2, img1);
    			append_dev(nav1, t3);
    			append_dev(nav1, div5);
    			append_dev(div5, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul1, null);
    				}
    			}

    			insert_dev(target, t4, anchor);
    			insert_dev(target, div7, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*navbarlinks*/ 0) {
    				each_value_1 = navbarlinks;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$4(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$4(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*navbarlinks*/ 0) {
    				each_value = navbarlinks;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$7(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$7(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navbar', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ navbarlinks });
    	return [];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src\Contact.svelte generated by Svelte v3.59.2 */

    const file$9 = "src\\Contact.svelte";

    function create_fragment$a(ctx) {
    	let section;
    	let article;
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let h2;
    	let t3;
    	let p0;
    	let t5;
    	let address;
    	let p1;
    	let t7;
    	let p2;
    	let t9;
    	let p3;
    	let t10;
    	let a;

    	const block = {
    		c: function create() {
    			section = element("section");
    			article = element("article");
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Contact Us";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "Get in Touch";
    			t3 = space();
    			p0 = element("p");
    			p0.textContent = "If you have any questions or suggestions, don't hesitate to contact us.";
    			t5 = space();
    			address = element("address");
    			p1 = element("p");
    			p1.textContent = "Organisation by";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Congress Compact 2C GmbH";
    			t9 = space();
    			p3 = element("p");
    			t10 = text("Email ");
    			a = element("a");
    			a.textContent = "info@congress-compact.de";
    			attr_dev(h1, "class", "uk-heading-small");
    			add_location(h1, file$9, 6, 16, 378);
    			attr_dev(h2, "class", "uk-text-bold uk-margin-small-bottom");
    			add_location(h2, file$9, 7, 16, 440);
    			attr_dev(p0, "class", "uk-text-lead uk-margin-small-bottom");
    			add_location(p0, file$9, 8, 16, 523);
    			attr_dev(p1, "class", "uk-margin-remove uk-text-bold");
    			add_location(p1, file$9, 12, 20, 787);
    			attr_dev(p2, "class", "uk-margin-remove uk-text-bold");
    			add_location(p2, file$9, 13, 20, 869);
    			attr_dev(a, "class", "uk-link-muted");
    			attr_dev(a, "href", "mailto:info@congress-compact.de");
    			add_location(a, file$9, 15, 54, 1140);
    			attr_dev(p3, "class", "uk-margin-remove");
    			add_location(p3, file$9, 15, 20, 1106);
    			attr_dev(address, "class", "uk-margin-small-top");
    			add_location(address, file$9, 11, 16, 728);
    			attr_dev(div0, "class", "");
    			add_location(div0, file$9, 5, 12, 346);
    			attr_dev(div1, "class", "uk-grid uk-grid-collapse uk-grid-match uk-child-width-1-2@m uk-margin-large-top");
    			attr_dev(div1, "uk-grid", "");
    			add_location(div1, file$9, 3, 8, 193);
    			attr_dev(article, "class", "uk-container uk-container-expand");
    			add_location(article, file$9, 2, 4, 133);
    			attr_dev(section, "id", "contact");
    			attr_dev(section, "class", "uk-section uk-background-muted uk-padding-large uk-flex uk-flex-middle");
    			add_location(section, file$9, 1, 0, 26);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, article);
    			append_dev(article, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, h2);
    			append_dev(div0, t3);
    			append_dev(div0, p0);
    			append_dev(div0, t5);
    			append_dev(div0, address);
    			append_dev(address, p1);
    			append_dev(address, t7);
    			append_dev(address, p2);
    			append_dev(address, t9);
    			append_dev(address, p3);
    			append_dev(p3, t10);
    			append_dev(p3, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Contact', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\Footer.svelte generated by Svelte v3.59.2 */

    const file$8 = "src\\Footer.svelte";

    function create_fragment$9(ctx) {
    	let footer;
    	let a;

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			a = element("a");
    			a.textContent = "EUSUHM   European Union for School and University Health and Medicine";
    			attr_dev(a, "class", "uk-link-muted");
    			attr_dev(a, "href", "https://eusuhm.org");
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$8, 1, 4, 113);
    			attr_dev(footer, "class", "uk-text-center uk-text-small uk-padding-small uk-margin-top-xlarge uk-background-secondary");
    			add_location(footer, file$8, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, a);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Footer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const congressData = writable({
        // 'Wissenschaftliche Leitung': {   
        //     name: 'TBD',
        //     organisation: 'TBD'
        // },
        
        'Programme Committee': [
            {
                organisation: 'BVÖGD',
                fullname: 'Federal Association of Doctors in\u00A0the\u00A0Public Health Service',
                link: 'https://www.bvoegd.de/',
                members: ['Gabriele Ellsäßer', 'Bettina Langenbruch', 'Karlin Stark', 'Gabriele Trost-Brinkhues', 'Andrea Wünsch', 'Claudia Korebrits']
            },
            {
                organisation: 'ScolarMed',
                fullname: 'Swiss Association of Specialists in\u00A0the\u00A0School Health\u00A0Service',
                link: 'https://www.scolarmed.ch/index.php/de/',
                members: ['Tina Huber-Gieseke', 'Susanne Stronski']
            },
            {
                organisation: 'EUSUHM\'s Executive Committee',
                fullname: 'European Union for School and University Health and Medicine',
                link: 'https://eusuhm.org/',
                members: ['Noora Seilo', 'Marija Posavec', 'Bernarda Vogrin', 'Zophia Nagy', 'Lineke Dogger']
            },
            {
                organisation: 'DGÖG',
                fullname: 'German Association for\u00A0Public\u00A0Health\u00A0Service',
                link: 'https://www.dgoeg.de/',
                members: ['Claudia Korebrits']
            },
            {
                organisation: 'DGSPJ',
                fullname: 'German Association for Social Paediatrics and Youth Medicine',
                link: 'https://www.dgspj.de/',
                members: ['Heidrun Thaiss']
            }
        ],
        'Location': {
            name: 'Oberlinschule',
            address: 'Rudolf-Breitscheid-Straße\u00A024',
            city: '14482 Potsdam',
        },
        'Organiser': {
            company: 'Congress Compact 2C GmbH',
            contact: 'Gina\u00A0Braun, Gina\u00A0Isemann, Anne\u00A0Klein',
            address: 'Joachimsthaler Straße 31-32', 
            address2: '10719\u00A0Berlin',
            phone: '+49 30 88727370',
            // fax: '+49 30 887273710',
            email: 'info@congress-compact.de',
        },    
        'Certification': {
            // content:'Certification of the event will be applied for at the Hamburg Medical Association, Ärztekammer Hamburg.'
            line1:'The event’s accreditation will be ',
            line2:'recognized by a medical association.'
        },
        // 'Registration Fees': {
        //     cat1: 'members:early bird: 280€, then 300€',
        //     cat2: 'non-members:early bird: 380€, then 400€',
        //     cat3: 'students: early bird: 150€, then 170€',
        //     cat4: 'day_ticket: early bird: 120€, then 140€',
        //     cat5: 'nurses: early bird: 120€, then 140€',
        //     evening: 'evening event: 70€'
        //   },
        'Registration Fees': {
            'Full\u00A0Participant EUSUHM\u00A0Member': { early_bird: 280, regular: 300, late: 330 },
            'Full\u00A0Participant Non\u2011EUSUHM\u00A0Member': { early_bird: 380, regular: 400, late: 430 },
            Student: { early_bird: 150, regular: 170, late: 190 },
            'Daily Ticket': { early_bird: 120, regular: 140, late: 180 },
            //'Daily ticket ': { early_bird: 120, regular: 140, late: 160 },
            'Attendance for the School Nurse Session only': { early_bird: 120, regular: 140, late: 160 },
            'Congress Gala Dinner': { early_bird:70, regular:70, late:70}
        }
    });

    /* src\Landing.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$2 } = globals;
    const file$7 = "src\\Landing.svelte";

    function get_each_context$6(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i][0];
    	child_ctx[4] = list[i][1];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i][0];
    	child_ctx[8] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_2$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i][0];
    	child_ctx[4] = list[i][1];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_3$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i][0];
    	child_ctx[8] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_4$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i][0];
    	child_ctx[15] = list[i][1];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	return child_ctx;
    }

    // (17:12) {#if index === 0}
    function create_if_block_4$2(ctx) {
    	let div;
    	let t;
    	let if_block = /*section*/ ctx[3] !== /*notdisplayed*/ ctx[1] && create_if_block_5$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			attr_dev(div, "class", "eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top");
    			add_location(div, file$7, 17, 14, 574);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (/*section*/ ctx[3] !== /*notdisplayed*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5$1(ctx);
    					if_block.c();
    					if_block.m(div, t);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(17:12) {#if index === 0}",
    		ctx
    	});

    	return block;
    }

    // (19:18) {#if section!==notdisplayed}
    function create_if_block_5$1(ctx) {
    	let h1;
    	let t0_value = /*section*/ ctx[3] + "";
    	let t0;
    	let t1;
    	let each_1_anchor;
    	let each_value_3 = Object.entries(/*details*/ ctx[4]);
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3$1(get_each_context_3$1(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(h1, "class", "eus-line-height-1");
    			add_location(h1, file$7, 19, 22, 735);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*section*/ ctx[3] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*Array, Object, data*/ 1) {
    				each_value_3 = Object.entries(/*details*/ ctx[4]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3$1(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(19:18) {#if section!==notdisplayed}",
    		ctx
    	});

    	return block;
    }

    // (48:26) {:else}
    function create_else_block_1$1(ctx) {
    	let t_value = /*value*/ ctx[8] + "";
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    			br = element("br");
    			add_location(br, file$7, 48, 37, 2796);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*value*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(48:26) {:else}",
    		ctx
    	});

    	return block;
    }

    // (26:62) 
    function create_if_block_7(ctx) {
    	let div;
    	let t;
    	let each_value_4 = Object.entries(/*value*/ ctx[8]);
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4$1(get_each_context_4$1(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "uk-grid");
    			add_location(div, file$7, 26, 30, 1138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, data*/ 1) {
    				each_value_4 = Object.entries(/*value*/ ctx[8]);
    				validate_each_argument(each_value_4);
    				let i;

    				for (i = 0; i < each_value_4.length; i += 1) {
    					const child_ctx = get_each_context_4$1(ctx, each_value_4, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_4$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_4.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(26:62) ",
    		ctx
    	});

    	return block;
    }

    // (23:26) {#if Array.isArray(value)}
    function create_if_block_6(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(23:26) {#if Array.isArray(value)}",
    		ctx
    	});

    	return block;
    }

    // (37:67) 
    function create_if_block_9(ctx) {
    	let div;
    	let ul;
    	let each_value_5 = /*innerValue*/ ctx[15];
    	validate_each_argument(each_value_5);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_5.length; i += 1) {
    		each_blocks[i] = create_each_block_5(get_each_context_5(ctx, each_value_5, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "uk-list eus-margin-0");
    			add_location(ul, file$7, 38, 46, 2218);
    			attr_dev(div, "class", "uk-width-1-2 eus-width-1-1-mobile");
    			add_location(div, file$7, 37, 40, 2123);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, data*/ 1) {
    				each_value_5 = /*innerValue*/ ctx[15];
    				validate_each_argument(each_value_5);
    				let i;

    				for (i = 0; i < each_value_5.length; i += 1) {
    					const child_ctx = get_each_context_5(ctx, each_value_5, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_5.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(37:67) ",
    		ctx
    	});

    	return block;
    }

    // (29:36) {#if innerKey==='organisation'}
    function create_if_block_8(ctx) {
    	let div;
    	let a;
    	let h2;
    	let t0_value = /*innerValue*/ ctx[15] + "";
    	let t0;
    	let t1;
    	let h3;
    	let t2_value = /*value*/ ctx[8].fullname + "";
    	let t2;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			h3 = element("h3");
    			t2 = text(t2_value);
    			attr_dev(h2, "class", "eus-line-height-1 eus-topborder eus-margin-0 ");
    			add_location(h2, file$7, 32, 44, 1649);
    			attr_dev(h3, "class", "eus-text-green uk-padding-remove uk-margin-remove uk-padding-bottom");
    			add_location(h3, file$7, 33, 48, 1774);
    			attr_dev(a, "href", a_href_value = /*value*/ ctx[8].link);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "rel", "noopener");
    			add_location(a, file$7, 31, 44, 1549);
    			attr_dev(div, "class", "uk-width-1-2 eus-width-1-1-mobile");
    			add_location(div, file$7, 29, 40, 1367);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, h2);
    			append_dev(h2, t0);
    			append_dev(a, t1);
    			append_dev(a, h3);
    			append_dev(h3, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*innerValue*/ ctx[15] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*data*/ 1 && t2_value !== (t2_value = /*value*/ ctx[8].fullname + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = /*value*/ ctx[8].link)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(29:36) {#if innerKey==='organisation'}",
    		ctx
    	});

    	return block;
    }

    // (40:50) {#each innerValue as person}
    function create_each_block_5(ctx) {
    	let li;
    	let t_value = /*person*/ ctx[17] + "";
    	let t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "eus-margin-0 uk-text-lead");
    			add_location(li, file$7, 40, 54, 2387);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*person*/ ctx[17] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_5.name,
    		type: "each",
    		source: "(40:50) {#each innerValue as person}",
    		ctx
    	});

    	return block;
    }

    // (28:34) {#each Object.entries(value) as [innerKey, innerValue],index}
    function create_each_block_4$1(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*innerKey*/ ctx[14] === 'organisation') return create_if_block_8;
    		if (/*innerKey*/ ctx[14] === 'members') return create_if_block_9;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4$1.name,
    		type: "each",
    		source: "(28:34) {#each Object.entries(value) as [innerKey, innerValue],index}",
    		ctx
    	});

    	return block;
    }

    // (21:22) {#each Object.entries(details) as [key, value]}
    function create_each_block_3$1(ctx) {
    	let show_if;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*data*/ 1) show_if = null;
    		if (show_if == null) show_if = !!Array.isArray(/*value*/ ctx[8]);
    		if (show_if) return create_if_block_6;
    		if (typeof /*value*/ ctx[8] === 'object') return create_if_block_7;
    		return create_else_block_1$1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3$1.name,
    		type: "each",
    		source: "(21:22) {#each Object.entries(details) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {#each Object.entries(data) as [section, details], index}
    function create_each_block_2$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*index*/ ctx[6] === 0 && create_if_block_4$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[6] === 0) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$2.name,
    		type: "each",
    		source: "(16:8) {#each Object.entries(data) as [section, details], index}",
    		ctx
    	});

    	return block;
    }

    // (59:12) {#if index !== 0}
    function create_if_block$4(ctx) {
    	let div;
    	let t;
    	let br;
    	let if_block = /*section*/ ctx[3] !== /*notdisplayed*/ ctx[1] && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			t = space();
    			br = element("br");
    			attr_dev(div, "class", "eus-width-1-2-desktop eus-width-1-1-mobile uk-padding uk-padding-remove-top");
    			add_location(div, file$7, 59, 14, 3107);
    			add_location(br, file$7, 76, 14, 4061);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*section*/ ctx[3] !== /*notdisplayed*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(59:12) {#if index !== 0}",
    		ctx
    	});

    	return block;
    }

    // (61:18) {#if section!==notdisplayed}
    function create_if_block_1$3(ctx) {
    	let h1;
    	let t0_value = /*section*/ ctx[3] + "";
    	let t0;
    	let t1;
    	let p;
    	let each_value_1 = Object.entries(/*details*/ ctx[4]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			p = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "uk-margin-remove");
    			add_location(h1, file$7, 61, 20, 3266);
    			attr_dev(p, "class", "uk-margin-remove uk-text-large");
    			set_style(p, "padding-left", "2px");
    			add_location(p, file$7, 62, 20, 3331);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(p, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*section*/ ctx[3] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*Object, data*/ 1) {
    				each_value_1 = Object.entries(/*details*/ ctx[4]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(61:18) {#if section!==notdisplayed}",
    		ctx
    	});

    	return block;
    }

    // (69:32) {:else}
    function create_else_block$3(ctx) {
    	let t_value = /*value*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*value*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(69:32) {:else}",
    		ctx
    	});

    	return block;
    }

    // (67:56) 
    function create_if_block_3$2(ctx) {
    	let a;
    	let t_value = /*value*/ ctx[8] + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "uk-link-muted");
    			attr_dev(a, "href", a_href_value = "tel:" + /*value*/ ctx[8]);
    			add_location(a, file$7, 67, 36, 3715);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*value*/ ctx[8] + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "tel:" + /*value*/ ctx[8])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(67:56) ",
    		ctx
    	});

    	return block;
    }

    // (65:32) {#if key==='email'}
    function create_if_block_2$3(ctx) {
    	let a;
    	let t_value = /*value*/ ctx[8] + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "uk-link-muted");
    			attr_dev(a, "href", a_href_value = "mailto:" + /*value*/ ctx[8]);
    			add_location(a, file$7, 65, 36, 3561);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*value*/ ctx[8] + "")) set_data_dev(t, t_value);

    			if (dirty & /*data*/ 1 && a_href_value !== (a_href_value = "mailto:" + /*value*/ ctx[8])) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(65:32) {#if key==='email'}",
    		ctx
    	});

    	return block;
    }

    // (64:22) {#each Object.entries(details) as [key, value]}
    function create_each_block_1$3(ctx) {
    	let t;
    	let br;

    	function select_block_type_2(ctx, dirty) {
    		if (/*key*/ ctx[7] === 'email') return create_if_block_2$3;
    		if (/*key*/ ctx[7] === 'phone') return create_if_block_3$2;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_2(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			t = text("\r\n                                 ");
    			br = element("br");
    			add_location(br, file$7, 71, 38, 3936);
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_2(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(64:22) {#each Object.entries(details) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    // (58:8) {#each Object.entries(data) as [section, details], index}
    function create_each_block$6(ctx) {
    	let if_block_anchor;
    	let if_block = /*index*/ ctx[6] !== 0 && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[6] !== 0) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$6.name,
    		type: "each",
    		source: "(58:8) {#each Object.entries(data) as [section, details], index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let main;
    	let article;
    	let div2;
    	let div0;
    	let t;
    	let div1;
    	let each_value_2 = Object.entries(/*data*/ ctx[0]);
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2$2(get_each_context_2$2(ctx, each_value_2, i));
    	}

    	let each_value = Object.entries(/*data*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$6(get_each_context$6(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			article = element("article");
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "uk-width-1-2 eus-width-1-1-mobile");
    			add_location(div0, file$7, 14, 4, 411);
    			attr_dev(div1, "class", "uk-width-1-2");
    			add_location(div1, file$7, 56, 4, 2965);
    			attr_dev(div2, "class", "uk-grid uk-grid-column");
    			add_location(div2, file$7, 13, 2, 369);
    			attr_dev(article, "id", "landing-data");
    			attr_dev(article, "class", "uk-padding-remove-top");
    			add_location(article, file$7, 12, 0, 308);
    			attr_dev(main, "class", "uk-container eus-padding-remove");
    			add_location(main, file$7, 11, 0, 260);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, article);
    			append_dev(article, div2);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(div2, t);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, data, Array, notdisplayed*/ 3) {
    				each_value_2 = Object.entries(/*data*/ ctx[0]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*Object, data, notdisplayed*/ 3) {
    				each_value = Object.entries(/*data*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$6(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$6(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let data;
    	let $congressData;
    	validate_store(congressData, 'congressData');
    	component_subscribe($$self, congressData, $$value => $$invalidate(2, $congressData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Landing', slots, []);
    	let notdisplayed = 'Registration Fees';
    	const writable_props = [];

    	Object_1$2.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Landing> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		congressData,
    		notdisplayed,
    		data,
    		$congressData
    	});

    	$$self.$inject_state = $$props => {
    		if ('notdisplayed' in $$props) $$invalidate(1, notdisplayed = $$props.notdisplayed);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$congressData*/ 4) {
    			// Auto-Subscription des Svelte Stores
    			$$invalidate(0, data = $congressData);
    		}
    	};

    	return [data, notdisplayed, $congressData];
    }

    class Landing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Landing",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src\Submit.svelte generated by Svelte v3.59.2 */
    const file$6 = "src\\Submit.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let article;
    	let div1;
    	let h10;
    	let t1;
    	let div0;
    	let a0;
    	let button;
    	let t3;
    	let div2;
    	let h11;
    	let t5;
    	let p0;
    	let t6;
    	let br;
    	let t7;
    	let t8;
    	let section0;
    	let h40;
    	let t10;
    	let ul0;
    	let li0;
    	let t12;
    	let li1;
    	let t14;
    	let h41;
    	let t16;
    	let ul1;
    	let li2;
    	let span0;
    	let t18;
    	let span1;
    	let t20;
    	let t21;
    	let li3;
    	let t23;
    	let li4;
    	let t25;
    	let li5;
    	let t27;
    	let section1;
    	let h2;
    	let t29;
    	let h42;
    	let t31;
    	let ul2;
    	let li6;
    	let t33;
    	let li7;
    	let t35;
    	let li8;
    	let t37;
    	let li9;
    	let t39;
    	let li10;
    	let t41;
    	let li11;
    	let t43;
    	let h43;
    	let t45;
    	let p1;
    	let t47;
    	let h30;
    	let t49;
    	let ul6;
    	let li12;
    	let span2;
    	let t51;
    	let span3;
    	let t53;
    	let span4;
    	let t55;
    	let t56;
    	let li13;
    	let span5;
    	let t58;
    	let span6;
    	let t60;
    	let t61;
    	let li20;
    	let span7;
    	let t63;
    	let a1;
    	let t65;
    	let ul4;
    	let li14;
    	let t67;
    	let li19;
    	let t68;
    	let ul3;
    	let li15;
    	let t70;
    	let li16;
    	let t72;
    	let li17;
    	let t74;
    	let li18;
    	let t76;
    	let li24;
    	let span8;
    	let t78;
    	let ul5;
    	let li21;
    	let t80;
    	let li22;
    	let t82;
    	let li23;
    	let t84;
    	let h31;
    	let t86;
    	let p2;
    	let t87;
    	let a2;
    	let t89;
    	let t90;
    	let section2;
    	let h32;
    	let t92;
    	let ul7;
    	let li25;
    	let t94;
    	let li26;
    	let t96;
    	let li27;
    	let t98;
    	let li28;
    	let t100;
    	let li29;
    	let t102;
    	let li30;
    	let t104;
    	let li31;
    	let t106;
    	let li32;
    	let t108;
    	let li33;
    	let t110;
    	let li34;
    	let t112;
    	let li35;
    	let t114;
    	let li36;
    	let t116;
    	let li37;
    	let t118;
    	let li38;

    	const block = {
    		c: function create() {
    			main = element("main");
    			article = element("article");
    			div1 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Submit your abstract here";
    			t1 = space();
    			div0 = element("div");
    			a0 = element("a");
    			button = element("button");
    			button.textContent = `${topbuttons[1].label2}`;
    			t3 = space();
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Rules for Abstract Submission";
    			t5 = space();
    			p0 = element("p");
    			t6 = text("Please read the submission rules before submitting an abstract.\r\n        ");
    			br = element("br");
    			t7 = text("Abstracts must be submitted online via the website only (www.EUSUHM.info).");
    			t8 = space();
    			section0 = element("section");
    			h40 = element("h4");
    			h40.textContent = "Submission and Presentation Type";
    			t10 = space();
    			ul0 = element("ul");
    			li0 = element("li");
    			li0.textContent = "Abstracts may be submitted for oral or printed poster presentation. The Programme Committee will determine whether the abstract will be accepted for presentation, with consideration given to the author’s preference.";
    			t12 = space();
    			li1 = element("li");
    			li1.textContent = "Abstracts must be received by the announced deadline. Abstracts received after the deadline will not be considered.";
    			t14 = space();
    			h41 = element("h4");
    			h41.textContent = "Limitations";
    			t16 = space();
    			ul1 = element("ul");
    			li2 = element("li");
    			span0 = element("span");
    			span0.textContent = "Presenting author must be registered participant.";
    			t18 = text(" Only abstracts of authors who have paid their registration fees by ");
    			span1 = element("span");
    			span1.textContent = "the Early Registration Deadline";
    			t20 = text(" will be scheduled for presentation and included for publication.");
    			t21 = space();
    			li3 = element("li");
    			li3.textContent = "The presenting author is required to ensure that all co-authors are aware of the content of the abstract and agree to its submission, before submitting the abstract.";
    			t23 = space();
    			li4 = element("li");
    			li4.textContent = "Abstracts must be submitted in British English.";
    			t25 = space();
    			li5 = element("li");
    			li5.textContent = "Disclosure of Conflicts of Interest: Abstract submitters will be required to disclose any conflict of interests in the submission form.";
    			t27 = space();
    			section1 = element("section");
    			h2 = element("h2");
    			h2.textContent = "Guidelines for Submission";
    			t29 = space();
    			h42 = element("h4");
    			h42.textContent = "Before you begin, please prepare the following information.";
    			t31 = space();
    			ul2 = element("ul");
    			li6 = element("li");
    			li6.textContent = "Presenting author’s contact details.";
    			t33 = space();
    			li7 = element("li");
    			li7.textContent = "Full first and family name(s)";
    			t35 = space();
    			li8 = element("li");
    			li8.textContent = "Email address";
    			t37 = space();
    			li9 = element("li");
    			li9.textContent = "Affiliation details: department, institution, city, state (if relevant), country";
    			t39 = space();
    			li10 = element("li");
    			li10.textContent = "Phone number.";
    			t41 = space();
    			li11 = element("li");
    			li11.textContent = "Author’s and co-authors’ details";
    			t43 = space();
    			h43 = element("h4");
    			h43.textContent = "Preferred Presentation type";
    			t45 = space();
    			p1 = element("p");
    			p1.textContent = "Oral or E-Poster";
    			t47 = space();
    			h30 = element("h3");
    			h30.textContent = "Abstract Content";
    			t49 = space();
    			ul6 = element("ul");
    			li12 = element("li");
    			span2 = element("span");
    			span2.textContent = "Abstract title";
    			t51 = text(" – must be in ");
    			span3 = element("span");
    			span3.textContent = "UPPER CASE";
    			t53 = text(" and ");
    			span4 = element("span");
    			span4.textContent = "limited to 150 characters";
    			t55 = text(".");
    			t56 = space();
    			li13 = element("li");
    			span5 = element("span");
    			span5.textContent = "Abstract text";
    			t58 = text(" – is limited to ");
    			span6 = element("span");
    			span6.textContent = "3000 characters";
    			t60 = text(" including acknowledgements.");
    			t61 = space();
    			li20 = element("li");
    			span7 = element("span");
    			span7.textContent = "Abstract topic";
    			t63 = text(" – select the abstract topic from the ");
    			a1 = element("a");
    			a1.textContent = "list of topics.";
    			t65 = space();
    			ul4 = element("ul");
    			li14 = element("li");
    			li14.textContent = "Please note, that the list of topics refers to settings for children, adolescents, and students";
    			t67 = space();
    			li19 = element("li");
    			t68 = text("Abstracts should clearly state:\r\n                        ");
    			ul3 = element("ul");
    			li15 = element("li");
    			li15.textContent = "Background and aims";
    			t70 = space();
    			li16 = element("li");
    			li16.textContent = "Methods";
    			t72 = space();
    			li17 = element("li");
    			li17.textContent = "Results";
    			t74 = space();
    			li18 = element("li");
    			li18.textContent = "Conclusions with Take Home Messages";
    			t76 = space();
    			li24 = element("li");
    			span8 = element("span");
    			span8.textContent = "Abstract with case report";
    			t78 = space();
    			ul5 = element("ul");
    			li21 = element("li");
    			li21.textContent = "Case Descriptions Including Health and Education Needs";
    			t80 = space();
    			li22 = element("li");
    			li22.textContent = "Intervention";
    			t82 = space();
    			li23 = element("li");
    			li23.textContent = "Take Home Message";
    			t84 = space();
    			h31 = element("h3");
    			h31.textContent = "Completion of Procedure";
    			t86 = space();
    			p2 = element("p");
    			t87 = text("You will receive an abstract ID number via email after you have submitted your abstract.\r\n            Please refer to this abstract number in all correspondence regarding the abstract.\r\n            Please ");
    			a2 = element("a");
    			a2.textContent = "contact us";
    			t89 = text(" if you have not received confirmation that your abstract has been submitted.");
    			t90 = space();
    			section2 = element("section");
    			h32 = element("h3");
    			h32.textContent = "List of Topics Referring to Settings for Children, Adolescents, Students";
    			t92 = space();
    			ul7 = element("ul");
    			li25 = element("li");
    			li25.textContent = "Early Childhood Interventions";
    			t94 = space();
    			li26 = element("li");
    			li26.textContent = "Showcasing School Health Services";
    			t96 = space();
    			li27 = element("li");
    			li27.textContent = "Mental Health";
    			t98 = space();
    			li28 = element("li");
    			li28.textContent = "Chronic Health Conditions, Including Case Reports";
    			t100 = space();
    			li29 = element("li");
    			li29.textContent = "Special Needs";
    			t102 = space();
    			li30 = element("li");
    			li30.textContent = "School Absences & School Health Services";
    			t104 = space();
    			li31 = element("li");
    			li31.textContent = "Qualification of Health Professionals";
    			t106 = space();
    			li32 = element("li");
    			li32.textContent = "Health Monitoring – Data for Action";
    			t108 = space();
    			li33 = element("li");
    			li33.textContent = "Health Promotion & School Health Services";
    			t110 = space();
    			li34 = element("li");
    			li34.textContent = "Sexuality, Puberty, Diversity";
    			t112 = space();
    			li35 = element("li");
    			li35.textContent = "Post Pandemic - Impact on Health";
    			t114 = space();
    			li36 = element("li");
    			li36.textContent = "Intersectoral Collaboration";
    			t116 = space();
    			li37 = element("li");
    			li37.textContent = "Transition";
    			t118 = space();
    			li38 = element("li");
    			li38.textContent = "Free Topics";
    			attr_dev(h10, "class", "uk-heading-large uk-text-center");
    			add_location(h10, file$6, 8, 8, 291);
    			set_style(button, "-min-width", "61%");
    			set_style(button, "min-height", "90px");
    			set_style(button, "font-size", "30px");
    			set_style(button, "font-weight", "bold");
    			set_style(button, "box-shadow", "0 10px 10px #0001");
    			attr_dev(button, "class", "uk-button uk-button-secondary uk-button-large uk-margin");
    			add_location(button, file$6, 13, 16, 621);
    			set_style(a0, "color", "white");
    			attr_dev(a0, "href", "");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$6, 12, 12, 554);
    			attr_dev(div0, "class", "uk-flex uk-flex-center uk-padding-large");
    			add_location(div0, file$6, 10, 8, 378);
    			attr_dev(div1, "class", "uk-container uk-padding-large uk-background-muted uk-box-shadow-xlarge");
    			add_location(div1, file$6, 7, 4, 197);
    			attr_dev(h11, "class", "uk-heading-small eus-normcase uk-text-center");
    			add_location(h11, file$6, 21, 8, 1023);
    			add_location(br, file$6, 23, 8, 1223);
    			attr_dev(p0, "class", "uk-text-center");
    			add_location(p0, file$6, 22, 8, 1124);
    			attr_dev(h40, "class", "eus-normcase");
    			add_location(h40, file$6, 26, 12, 1402);
    			add_location(li0, file$6, 28, 16, 1500);
    			add_location(li1, file$6, 29, 16, 1742);
    			add_location(ul0, file$6, 27, 12, 1478);
    			attr_dev(h41, "class", "eus-normcase");
    			add_location(h41, file$6, 31, 12, 1899);
    			attr_dev(span0, "class", "eus-highlight");
    			add_location(span0, file$6, 33, 20, 1980);
    			attr_dev(span1, "class", "eus-highlight");
    			add_location(span1, file$6, 33, 172, 2132);
    			add_location(li2, file$6, 33, 16, 1976);
    			add_location(li3, file$6, 34, 16, 2286);
    			add_location(li4, file$6, 35, 16, 2478);
    			add_location(li5, file$6, 36, 16, 2552);
    			add_location(ul1, file$6, 32, 12, 1954);
    			attr_dev(section0, "class", "uk-box-shadow-large uk-article uk-padding");
    			add_location(section0, file$6, 24, 8, 1315);
    			attr_dev(h2, "class", "eus-normcase");
    			add_location(h2, file$6, 41, 8, 2816);
    			attr_dev(h42, "class", "uk-margin-remove eus-normcase");
    			add_location(h42, file$6, 42, 8, 2881);
    			attr_dev(li6, "class", "eus-highlight");
    			add_location(li6, file$6, 45, 12, 3029);
    			add_location(li7, file$6, 46, 12, 3110);
    			add_location(li8, file$6, 47, 12, 3162);
    			add_location(li9, file$6, 48, 12, 3198);
    			add_location(li10, file$6, 49, 12, 3301);
    			add_location(li11, file$6, 50, 12, 3337);
    			add_location(ul2, file$6, 43, 8, 2997);
    			attr_dev(h43, "class", "eus-normcase");
    			add_location(h43, file$6, 53, 8, 3417);
    			add_location(p1, file$6, 54, 8, 3484);
    			attr_dev(h30, "class", "eus-normcase");
    			add_location(h30, file$6, 55, 8, 3523);
    			attr_dev(span2, "class", "eus-highlight");
    			add_location(span2, file$6, 57, 16, 3601);
    			attr_dev(span3, "class", "eus-highlight");
    			add_location(span3, file$6, 57, 79, 3664);
    			attr_dev(span4, "class", "eus-highlight");
    			add_location(span4, file$6, 57, 129, 3714);
    			add_location(li12, file$6, 57, 12, 3597);
    			attr_dev(span5, "class", "eus-highlight");
    			add_location(span5, file$6, 58, 16, 3798);
    			attr_dev(span6, "class", "eus-highlight");
    			add_location(span6, file$6, 58, 81, 3863);
    			add_location(li13, file$6, 58, 12, 3794);
    			attr_dev(span7, "class", "eus-highlight");
    			add_location(span7, file$6, 59, 16, 3964);
    			attr_dev(a1, "href", "/programme");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener");
    			add_location(a1, file$6, 59, 103, 4051);
    			add_location(li14, file$6, 61, 20, 4166);
    			add_location(li15, file$6, 65, 28, 4413);
    			add_location(li16, file$6, 66, 28, 4471);
    			add_location(li17, file$6, 67, 28, 4517);
    			add_location(li18, file$6, 68, 28, 4563);
    			add_location(ul3, file$6, 64, 24, 4379);
    			add_location(li19, file$6, 62, 20, 4292);
    			add_location(ul4, file$6, 60, 16, 4140);
    			add_location(li20, file$6, 59, 12, 3960);
    			attr_dev(span8, "class", "eus-highlight");
    			add_location(span8, file$6, 71, 16, 4689);
    			add_location(li21, file$6, 73, 20, 4793);
    			add_location(li22, file$6, 74, 20, 4880);
    			add_location(li23, file$6, 75, 20, 4923);
    			add_location(ul5, file$6, 72, 16, 4767);
    			add_location(li24, file$6, 71, 12, 4685);
    			add_location(ul6, file$6, 56, 8, 3579);
    			attr_dev(h31, "class", "eus-normcase");
    			add_location(h31, file$6, 80, 8, 5018);
    			attr_dev(a2, "href", "mailto:info@eusuhm.info");
    			add_location(a2, file$6, 84, 19, 5303);
    			add_location(p2, file$6, 81, 8, 5081);
    			attr_dev(section1, "class", "uk-box-shadow-large uk-article uk-padding");
    			add_location(section1, file$6, 39, 8, 2745);
    			attr_dev(h32, "class", "eus-normcase");
    			add_location(h32, file$6, 89, 8, 5535);
    			add_location(li25, file$6, 91, 12, 5666);
    			add_location(li26, file$6, 92, 12, 5718);
    			add_location(li27, file$6, 93, 12, 5775);
    			add_location(li28, file$6, 94, 12, 5812);
    			add_location(li29, file$6, 95, 12, 5884);
    			add_location(li30, file$6, 96, 12, 5920);
    			add_location(li31, file$6, 97, 12, 5983);
    			add_location(li32, file$6, 98, 12, 6043);
    			add_location(li33, file$6, 99, 12, 6101);
    			add_location(li34, file$6, 100, 12, 6166);
    			add_location(li35, file$6, 101, 12, 6218);
    			add_location(li36, file$6, 102, 12, 6274);
    			add_location(li37, file$6, 103, 12, 6324);
    			add_location(li38, file$6, 104, 12, 6360);
    			add_location(ul7, file$6, 90, 8, 5648);
    			attr_dev(section2, "class", "uk-box-shadow-large uk-article uk-padding");
    			add_location(section2, file$6, 88, 4, 5466);
    			attr_dev(div2, "class", "uk-container uk-padding-large");
    			add_location(div2, file$6, 20, 4, 969);
    			attr_dev(article, "class", "uk-padding uk-margin-xlarge ");
    			add_location(article, file$6, 6, 0, 145);
    			attr_dev(main, "class", "uk-container eus-padding-remove ");
    			add_location(main, file$6, 5, 0, 96);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, article);
    			append_dev(article, div1);
    			append_dev(div1, h10);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, a0);
    			append_dev(a0, button);
    			append_dev(article, t3);
    			append_dev(article, div2);
    			append_dev(div2, h11);
    			append_dev(div2, t5);
    			append_dev(div2, p0);
    			append_dev(p0, t6);
    			append_dev(p0, br);
    			append_dev(p0, t7);
    			append_dev(div2, t8);
    			append_dev(div2, section0);
    			append_dev(section0, h40);
    			append_dev(section0, t10);
    			append_dev(section0, ul0);
    			append_dev(ul0, li0);
    			append_dev(ul0, t12);
    			append_dev(ul0, li1);
    			append_dev(section0, t14);
    			append_dev(section0, h41);
    			append_dev(section0, t16);
    			append_dev(section0, ul1);
    			append_dev(ul1, li2);
    			append_dev(li2, span0);
    			append_dev(li2, t18);
    			append_dev(li2, span1);
    			append_dev(li2, t20);
    			append_dev(ul1, t21);
    			append_dev(ul1, li3);
    			append_dev(ul1, t23);
    			append_dev(ul1, li4);
    			append_dev(ul1, t25);
    			append_dev(ul1, li5);
    			append_dev(div2, t27);
    			append_dev(div2, section1);
    			append_dev(section1, h2);
    			append_dev(section1, t29);
    			append_dev(section1, h42);
    			append_dev(section1, t31);
    			append_dev(section1, ul2);
    			append_dev(ul2, li6);
    			append_dev(ul2, t33);
    			append_dev(ul2, li7);
    			append_dev(ul2, t35);
    			append_dev(ul2, li8);
    			append_dev(ul2, t37);
    			append_dev(ul2, li9);
    			append_dev(ul2, t39);
    			append_dev(ul2, li10);
    			append_dev(ul2, t41);
    			append_dev(ul2, li11);
    			append_dev(section1, t43);
    			append_dev(section1, h43);
    			append_dev(section1, t45);
    			append_dev(section1, p1);
    			append_dev(section1, t47);
    			append_dev(section1, h30);
    			append_dev(section1, t49);
    			append_dev(section1, ul6);
    			append_dev(ul6, li12);
    			append_dev(li12, span2);
    			append_dev(li12, t51);
    			append_dev(li12, span3);
    			append_dev(li12, t53);
    			append_dev(li12, span4);
    			append_dev(li12, t55);
    			append_dev(ul6, t56);
    			append_dev(ul6, li13);
    			append_dev(li13, span5);
    			append_dev(li13, t58);
    			append_dev(li13, span6);
    			append_dev(li13, t60);
    			append_dev(ul6, t61);
    			append_dev(ul6, li20);
    			append_dev(li20, span7);
    			append_dev(li20, t63);
    			append_dev(li20, a1);
    			append_dev(li20, t65);
    			append_dev(li20, ul4);
    			append_dev(ul4, li14);
    			append_dev(ul4, t67);
    			append_dev(ul4, li19);
    			append_dev(li19, t68);
    			append_dev(li19, ul3);
    			append_dev(ul3, li15);
    			append_dev(ul3, t70);
    			append_dev(ul3, li16);
    			append_dev(ul3, t72);
    			append_dev(ul3, li17);
    			append_dev(ul3, t74);
    			append_dev(ul3, li18);
    			append_dev(ul6, t76);
    			append_dev(ul6, li24);
    			append_dev(li24, span8);
    			append_dev(li24, t78);
    			append_dev(li24, ul5);
    			append_dev(ul5, li21);
    			append_dev(ul5, t80);
    			append_dev(ul5, li22);
    			append_dev(ul5, t82);
    			append_dev(ul5, li23);
    			append_dev(section1, t84);
    			append_dev(section1, h31);
    			append_dev(section1, t86);
    			append_dev(section1, p2);
    			append_dev(p2, t87);
    			append_dev(p2, a2);
    			append_dev(p2, t89);
    			append_dev(div2, t90);
    			append_dev(div2, section2);
    			append_dev(section2, h32);
    			append_dev(section2, t92);
    			append_dev(section2, ul7);
    			append_dev(ul7, li25);
    			append_dev(ul7, t94);
    			append_dev(ul7, li26);
    			append_dev(ul7, t96);
    			append_dev(ul7, li27);
    			append_dev(ul7, t98);
    			append_dev(ul7, li28);
    			append_dev(ul7, t100);
    			append_dev(ul7, li29);
    			append_dev(ul7, t102);
    			append_dev(ul7, li30);
    			append_dev(ul7, t104);
    			append_dev(ul7, li31);
    			append_dev(ul7, t106);
    			append_dev(ul7, li32);
    			append_dev(ul7, t108);
    			append_dev(ul7, li33);
    			append_dev(ul7, t110);
    			append_dev(ul7, li34);
    			append_dev(ul7, t112);
    			append_dev(ul7, li35);
    			append_dev(ul7, t114);
    			append_dev(ul7, li36);
    			append_dev(ul7, t116);
    			append_dev(ul7, li37);
    			append_dev(ul7, t118);
    			append_dev(ul7, li38);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Submit', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Submit> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ topbuttons });
    	return [];
    }

    class Submit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Submit",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\Programme.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1$1 } = globals;
    const file$5 = "src\\Programme.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	child_ctx[4] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (19:10) {#if event.subevent}
    function create_if_block_4$1(ctx) {
    	let tr;
    	let td0;
    	let t0;
    	let td1;
    	let t1_value = /*event*/ ctx[8].startTime + "";
    	let t1;
    	let t2;
    	let td2;
    	let t4;
    	let td3;
    	let t5_value = /*event*/ ctx[8].endTime + "";
    	let t5;
    	let t6;
    	let td4;
    	let show_if;
    	let tr_class_value;

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*$eventSchedule*/ 1) show_if = null;
    		if (show_if == null) show_if = !!(typeof /*event*/ ctx[8].subevent === 'string' && /*event*/ ctx[8].subevent.toLowerCase().includes('interactive rooms'));
    		if (show_if) return create_if_block_5;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = space();
    			td1 = element("td");
    			t1 = text(t1_value);
    			t2 = space();
    			td2 = element("td");
    			td2.textContent = "─";
    			t4 = space();
    			td3 = element("td");
    			t5 = text(t5_value);
    			t6 = space();
    			td4 = element("td");
    			if_block.c();
    			attr_dev(td0, "class", "no-border ");
    			add_location(td0, file$5, 26, 14, 915);
    			attr_dev(td1, "class", "no-border ");
    			add_location(td1, file$5, 27, 14, 959);
    			attr_dev(td2, "class", "no-border ");
    			add_location(td2, file$5, 28, 14, 1020);
    			attr_dev(td3, "class", "no-border ");
    			add_location(td3, file$5, 29, 14, 1080);
    			attr_dev(td4, "class", "eus-subevent eus-subevent-title no-border");
    			add_location(td4, file$5, 31, 14, 1143);

    			attr_dev(tr, "class", tr_class_value = "eus-subevent-row " + (typeof /*event*/ ctx[8].subevent === 'string' && /*event*/ ctx[8].subevent.toLowerCase().includes('plenary')
    			? 'plenary'
    			: '') + "");

    			add_location(tr, file$5, 22, 14, 692);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, t1);
    			append_dev(tr, t2);
    			append_dev(tr, td2);
    			append_dev(tr, t4);
    			append_dev(tr, td3);
    			append_dev(td3, t5);
    			append_dev(tr, t6);
    			append_dev(tr, td4);
    			if_block.m(td4, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t1_value !== (t1_value = /*event*/ ctx[8].startTime + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$eventSchedule*/ 1 && t5_value !== (t5_value = /*event*/ ctx[8].endTime + "")) set_data_dev(t5, t5_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(td4, null);
    				}
    			}

    			if (dirty & /*$eventSchedule*/ 1 && tr_class_value !== (tr_class_value = "eus-subevent-row " + (typeof /*event*/ ctx[8].subevent === 'string' && /*event*/ ctx[8].subevent.toLowerCase().includes('plenary')
    			? 'plenary'
    			: '') + "")) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(19:10) {#if event.subevent}",
    		ctx
    	});

    	return block;
    }

    // (36:16) {:else}
    function create_else_block_3(ctx) {
    	let t_value = /*event*/ ctx[8].subevent + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t_value !== (t_value = /*event*/ ctx[8].subevent + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(36:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:16) {#if typeof event.subevent === 'string' && event.subevent.toLowerCase().includes('interactive rooms')}
    function create_if_block_5(ctx) {
    	let t0_value = /*event*/ ctx[8].subevent + "";
    	let t0;
    	let t1;
    	let a;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = space();
    			a = element("a");
    			a.textContent = "Rotation after 40 min – More Information";
    			attr_dev(a, "href", "#interactiverooms");
    			add_location(a, file$5, 34, 35, 1414);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, a, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t0_value !== (t0_value = /*event*/ ctx[8].subevent + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(34:16) {#if typeof event.subevent === 'string' && event.subevent.toLowerCase().includes('interactive rooms')}",
    		ctx
    	});

    	return block;
    }

    // (65:12) {:else}
    function create_else_block_1(ctx) {
    	let td0;
    	let t0_value = /*day*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*event*/ ctx[8].startTime + "";
    	let t2;
    	let t3;
    	let show_if;
    	let t4;
    	let td2;
    	let t5_value = /*event*/ ctx[8].endTime + "";
    	let t5;

    	function select_block_type_2(ctx, dirty) {
    		if (dirty & /*$eventSchedule*/ 1) show_if = null;
    		if (show_if == null) show_if = !!/*event*/ ctx[8].event.includes('Welcome');
    		if (show_if) return create_if_block_3$1;
    		return create_else_block_2;
    	}

    	let current_block_type = select_block_type_2(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			if_block.c();
    			t4 = space();
    			td2 = element("td");
    			t5 = text(t5_value);
    			add_location(td0, file$5, 65, 14, 2657);
    			add_location(td1, file$5, 66, 14, 2687);
    			add_location(td2, file$5, 73, 14, 3000);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, t2);
    			insert_dev(target, t3, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, td2, anchor);
    			append_dev(td2, t5);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t0_value !== (t0_value = /*day*/ ctx[5] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$eventSchedule*/ 1 && t2_value !== (t2_value = /*event*/ ctx[8].startTime + "")) set_data_dev(t2, t2_value);

    			if (current_block_type !== (current_block_type = select_block_type_2(ctx, dirty))) {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t4.parentNode, t4);
    				}
    			}

    			if (dirty & /*$eventSchedule*/ 1 && t5_value !== (t5_value = /*event*/ ctx[8].endTime + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t3);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(td2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(65:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (60:36) 
    function create_if_block_2$2(ctx) {
    	let td0;
    	let t0_value = /*day*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*event*/ ctx[8].startTime + "";
    	let t2;
    	let t3;
    	let td2;
    	let t5;
    	let td3;
    	let t6_value = /*event*/ ctx[8].endTime + "";
    	let t6;

    	const block = {
    		c: function create() {
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			td2.textContent = "─";
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			attr_dev(td0, "class", "no-border");
    			add_location(td0, file$5, 60, 14, 2411);
    			attr_dev(td1, "class", "no-border");
    			add_location(td1, file$5, 61, 14, 2459);
    			attr_dev(td2, "class", "no-border");
    			add_location(td2, file$5, 62, 14, 2519);
    			attr_dev(td3, "class", "no-border");
    			add_location(td3, file$5, 63, 14, 2578);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td0, anchor);
    			append_dev(td0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, td1, anchor);
    			append_dev(td1, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, td2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, td3, anchor);
    			append_dev(td3, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t0_value !== (t0_value = /*day*/ ctx[5] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$eventSchedule*/ 1 && t2_value !== (t2_value = /*event*/ ctx[8].startTime + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$eventSchedule*/ 1 && t6_value !== (t6_value = /*event*/ ctx[8].endTime + "")) set_data_dev(t6, t6_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(td1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(td2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(td3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(60:36) ",
    		ctx
    	});

    	return block;
    }

    // (54:12) {#if event.subevent}
    function create_if_block_1$2(ctx) {
    	let each_1_anchor;
    	let each_value_4 = Array(4);
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(54:12) {#if event.subevent}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {:else}
    function create_else_block_2(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			td.textContent = "─";
    			add_location(td, file$5, 71, 20, 2936);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(71:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (69:16) {#if event.event.includes('Welcome')}
    function create_if_block_3$1(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			add_location(td, file$5, 69, 20, 2880);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(69:16) {#if event.event.includes('Welcome')}",
    		ctx
    	});

    	return block;
    }

    // (56:14) {#each Array(4) as _}
    function create_each_block_4(ctx) {
    	let td;

    	const block = {
    		c: function create() {
    			td = element("td");
    			add_location(td, file$5, 57, 17, 2325);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(56:14) {#each Array(4) as _}",
    		ctx
    	});

    	return block;
    }

    // (94:14) {:else}
    function create_else_block$2(ctx) {
    	let t_value = /*event*/ ctx[8].event + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t_value !== (t_value = /*event*/ ctx[8].event + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(94:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (87:14) {#if Array.isArray(event.event)}
    function create_if_block$3(ctx) {
    	let div;
    	let each_value_3 = /*event*/ ctx[8].event;
    	validate_each_argument(each_value_3);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "eus-triplet eus-subevent");
    			add_location(div, file$5, 87, 16, 3645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule, Object*/ 1) {
    				each_value_3 = /*event*/ ctx[8].event;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_3.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(87:14) {#if Array.isArray(event.event)}",
    		ctx
    	});

    	return block;
    }

    // (89:18) {#each event.event as e}
    function create_each_block_3(ctx) {
    	let div;
    	let t_value = /*e*/ ctx[11] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "eus-flex1 eus-subevent");
    			add_location(div, file$5, 89, 20, 3749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t_value !== (t_value = /*e*/ ctx[11] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(89:18) {#each event.event as e}",
    		ctx
    	});

    	return block;
    }

    // (16:8) {#each $eventSchedule[day] as event, index}
    function create_each_block_2$1(ctx) {
    	let t0;
    	let tr;
    	let t1;
    	let td;
    	let show_if;
    	let td_class_value;
    	let tr_class_value;
    	let if_block0 = /*event*/ ctx[8].subevent && create_if_block_4$1(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (/*event*/ ctx[8].subevent) return create_if_block_1$2;
    		if (/*event*/ ctx[8].plenary) return create_if_block_2$2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block1 = current_block_type(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (dirty & /*$eventSchedule*/ 1) show_if = null;
    		if (show_if == null) show_if = !!Array.isArray(/*event*/ ctx[8].event);
    		if (show_if) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_3(ctx, -1);
    	let if_block2 = current_block_type_1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			tr = element("tr");
    			if_block1.c();
    			t1 = space();
    			td = element("td");
    			if_block2.c();

    			attr_dev(td, "class", td_class_value = "<!-- Subevent formatting --> " + (/*event*/ ctx[8].subevent ? 'eus-subevent' : '') + " <!-- Plenary Session Titling --> " + (/*event*/ ctx[8].event.includes('Plenary')
    			? 'eus-subevent-title'
    			: '') + " <!-- Break formatting --> " + (typeof /*event*/ ctx[8].event === 'string' && /*event*/ ctx[8].event.toLowerCase().includes('break')
    			? 'eus-Programmebreak'
    			: '') + "");

    			add_location(td, file$5, 77, 12, 3095);
    			attr_dev(tr, "class", tr_class_value = "<!-- Klasse für Titel von parallelen Veranstaltungen --> " + (/*event*/ ctx[8].subevent ? 'eus-subevent-row' : '') + " <!-- Sonderregel für Plenary Session (Anderer Hintergrund) --> " + (/*event*/ ctx[8].plenary ? 'plenary' : '') + "");
    			add_location(tr, file$5, 44, 10, 1752);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, tr, anchor);
    			if_block1.m(tr, null);
    			append_dev(tr, t1);
    			append_dev(tr, td);
    			if_block2.m(td, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*event*/ ctx[8].subevent) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(t0.parentNode, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(tr, t1);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_3(ctx, dirty)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_1(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(td, null);
    				}
    			}

    			if (dirty & /*$eventSchedule*/ 1 && td_class_value !== (td_class_value = "<!-- Subevent formatting --> " + (/*event*/ ctx[8].subevent ? 'eus-subevent' : '') + " <!-- Plenary Session Titling --> " + (/*event*/ ctx[8].event.includes('Plenary')
    			? 'eus-subevent-title'
    			: '') + " <!-- Break formatting --> " + (typeof /*event*/ ctx[8].event === 'string' && /*event*/ ctx[8].event.toLowerCase().includes('break')
    			? 'eus-Programmebreak'
    			: '') + "")) {
    				attr_dev(td, "class", td_class_value);
    			}

    			if (dirty & /*$eventSchedule*/ 1 && tr_class_value !== (tr_class_value = "<!-- Klasse für Titel von parallelen Veranstaltungen --> " + (/*event*/ ctx[8].subevent ? 'eus-subevent-row' : '') + " <!-- Sonderregel für Plenary Session (Anderer Hintergrund) --> " + (/*event*/ ctx[8].plenary ? 'plenary' : '') + "")) {
    				attr_dev(tr, "class", tr_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(tr);
    			if_block1.d();
    			if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(16:8) {#each $eventSchedule[day] as event, index}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {#each Object.keys($eventSchedule) as day}
    function create_each_block_1$2(ctx) {
    	let h3;
    	let t0_value = /*day*/ ctx[5] + "";
    	let t0;
    	let t1;
    	let table;
    	let t2;
    	let each_value_2 = /*$eventSchedule*/ ctx[0][/*day*/ ctx[5]];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(h3, "class", "uk-text-center uk-card uk-card-primary");
    			add_location(h3, file$5, 13, 6, 369);
    			attr_dev(table, "class", "eus-table uk-margin-large-top");
    			add_location(table, file$5, 14, 6, 438);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, table, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(table, null);
    				}
    			}

    			append_dev(table, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$eventSchedule*/ 1 && t0_value !== (t0_value = /*day*/ ctx[5] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$eventSchedule, Object, Array*/ 1) {
    				each_value_2 = /*$eventSchedule*/ ctx[0][/*day*/ ctx[5]];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(13:4) {#each Object.keys($eventSchedule) as day}",
    		ctx
    	});

    	return block;
    }

    // (115:8) {#each $interactiveRooms as room, i}
    function create_each_block$5(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t0_value = /*room*/ ctx[2] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(p, "class", "eus-text-large uk-margin-remove");
    			add_location(p, file$5, 119, 14, 4994);
    			set_style(div0, "background-color", euscolors[(2 + /*i*/ ctx[4]) % (euscolors.length - 1)]);
    			set_style(div0, "color", "black");
    			attr_dev(div0, "class", "eus-height-100 uk-card uk-card-hover uk-card-body uk-card-small uk-flex uk-flex-middle uk-flex-center");
    			add_location(div0, file$5, 117, 12, 4761);
    			attr_dev(div1, "class", "eus-clip");
    			add_location(div1, file$5, 116, 10, 4725);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$interactiveRooms*/ 2 && t0_value !== (t0_value = /*room*/ ctx[2] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(115:8) {#each $interactiveRooms as room, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let main;
    	let section0;
    	let h10;
    	let t1;
    	let t2;
    	let section1;
    	let h11;
    	let t4;
    	let h3;
    	let t6;
    	let p;
    	let t7;
    	let br;
    	let t8;
    	let t9;
    	let div;
    	let each_value_1 = Object.keys(/*$eventSchedule*/ ctx[0]);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*$interactiveRooms*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			section0 = element("section");
    			h10 = element("h1");
    			h10.textContent = "Programme";
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			section1 = element("section");
    			h11 = element("h1");
    			h11.textContent = "Interactive Rooms";
    			t4 = space();
    			h3 = element("h3");
    			h3.textContent = "Bridging Health and Education Gaps: Lessons Learnt";
    			t6 = space();
    			p = element("p");
    			t7 = text("Friday: 11:30  – 1:00 and 4:30  – 6:00\r\n       ");
    			br = element("br");
    			t8 = text(" Rotation after 40 Minutes");
    			t9 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h10, "class", "uk-text-center uk-heading-large");
    			add_location(h10, file$5, 8, 4, 245);
    			attr_dev(section0, "id", "Programme");
    			attr_dev(section0, "class", "uk-padding uk-margin-xlarge");
    			add_location(section0, file$5, 7, 2, 179);
    			attr_dev(h11, "class", "uk-text-center uk-heading-large");
    			add_location(h11, file$5, 107, 4, 4171);
    			add_location(h3, file$5, 108, 4, 4243);
    			add_location(br, file$5, 111, 7, 4420);
    			add_location(p, file$5, 110, 6, 4316);
    			attr_dev(div, "class", "uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-text-center uk-grid-match uk-margin-large-top");
    			attr_dev(div, "uk-grid", "");
    			add_location(div, file$5, 113, 4, 4484);
    			attr_dev(section1, "id", "interactiverooms");
    			attr_dev(section1, "class", "uk-padding uk-margin-xlarge");
    			add_location(section1, file$5, 106, 2, 4098);
    			attr_dev(main, "class", "uk-container");
    			add_location(main, file$5, 5, 0, 146);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section0);
    			append_dev(section0, h10);
    			append_dev(section0, t1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(section0, null);
    				}
    			}

    			append_dev(main, t2);
    			append_dev(main, section1);
    			append_dev(section1, h11);
    			append_dev(section1, t4);
    			append_dev(section1, h3);
    			append_dev(section1, t6);
    			append_dev(section1, p);
    			append_dev(p, t7);
    			append_dev(p, br);
    			append_dev(p, t8);
    			append_dev(section1, t9);
    			append_dev(section1, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$eventSchedule, Object, Array*/ 1) {
    				each_value_1 = Object.keys(/*$eventSchedule*/ ctx[0]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(section0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*euscolors, $interactiveRooms*/ 2) {
    				each_value = /*$interactiveRooms*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $eventSchedule;
    	let $interactiveRooms;
    	validate_store(eventSchedule, 'eventSchedule');
    	component_subscribe($$self, eventSchedule, $$value => $$invalidate(0, $eventSchedule = $$value));
    	validate_store(interactiveRooms, 'interactiveRooms');
    	component_subscribe($$self, interactiveRooms, $$value => $$invalidate(1, $interactiveRooms = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Programme', slots, []);
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Programme> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		each,
    		euscolors,
    		eventSchedule,
    		interactiveRooms,
    		$eventSchedule,
    		$interactiveRooms
    	});

    	return [$eventSchedule, $interactiveRooms];
    }

    class Programme extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Programme",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\Accomodation.svelte generated by Svelte v3.59.2 */
    const file$4 = "src\\Accomodation.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (15:16) {#each hotels as hotel}
    function create_each_block$4(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let h3;
    	let t0_value = /*hotel*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let p0;
    	let t2;
    	let span0;
    	let t3_value = /*hotel*/ ctx[1].room + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5;
    	let span1;
    	let t6_value = /*hotel*/ ctx[1].keyword + "";
    	let t6;
    	let t7;
    	let p2;
    	let t8;
    	let a;
    	let t9_value = /*hotel*/ ctx[1].contact + "";
    	let t9;
    	let t10;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = text("Rooms Available ");
    			span0 = element("span");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text("Keyword ");
    			span1 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			p2 = element("p");
    			t8 = text("Contact ");
    			a = element("a");
    			t9 = text(t9_value);
    			t10 = space();
    			attr_dev(h3, "class", "uk-card-title");
    			add_location(h3, file$4, 18, 32, 942);
    			attr_dev(span0, "class", "uk-text-primary");
    			add_location(span0, file$4, 19, 72, 1059);
    			attr_dev(p0, "class", "uk-text-meta");
    			add_location(p0, file$4, 19, 32, 1019);
    			attr_dev(span1, "class", "uk-text-primary");
    			add_location(span1, file$4, 20, 64, 1178);
    			attr_dev(p1, "class", "uk-text-meta");
    			add_location(p1, file$4, 20, 32, 1146);
    			attr_dev(a, "class", "uk-text-primary");
    			attr_dev(a, "href", "mailto:" + /*hotel*/ ctx[1].contact);
    			add_location(a, file$4, 21, 64, 1300);
    			attr_dev(p2, "class", "uk-text-meta");
    			add_location(p2, file$4, 21, 32, 1268);
    			attr_dev(div0, "class", "uk-card-body");
    			add_location(div0, file$4, 17, 28, 882);
    			attr_dev(div1, "class", "uk-card uk-card-default");
    			add_location(div1, file$4, 16, 24, 815);
    			add_location(div2, file$4, 15, 20, 784);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(p0, t2);
    			append_dev(p0, span0);
    			append_dev(span0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, t5);
    			append_dev(p1, span1);
    			append_dev(span1, t6);
    			append_dev(div0, t7);
    			append_dev(div0, p2);
    			append_dev(p2, t8);
    			append_dev(p2, a);
    			append_dev(a, t9);
    			append_dev(div2, t10);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(15:16) {#each hotels as hotel}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let main;
    	let section;
    	let article;
    	let h1;
    	let t1;
    	let div;
    	let each_value = /*hotels*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			article = element("article");
    			h1 = element("h1");
    			h1.textContent = "Accommodation";
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "uk-text-center uk-margin-large-top uk-heading-small");
    			add_location(h1, file$4, 12, 12, 561);
    			attr_dev(div, "class", "uk-grid uk-grid-match uk-child-width-1-3@m");
    			attr_dev(div, "uk-grid", "");
    			add_location(div, file$4, 13, 12, 657);
    			add_location(article, file$4, 11, 8, 538);
    			attr_dev(section, "class", "uk-padding uk-margin-xlarge-bottom");
    			add_location(section, file$4, 10, 4, 476);
    			attr_dev(main, "class", "uk-container");
    			add_location(main, file$4, 9, 0, 443);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
    			append_dev(section, article);
    			append_dev(article, h1);
    			append_dev(article, t1);
    			append_dev(article, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*hotels*/ 1) {
    				each_value = /*hotels*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Accomodation', slots, []);

    	let hotels = [
    		{
    			name: 'The niu Amity',
    			room: 30,
    			keyword: 'Congress Compact',
    			contact: 'reservation@novum-hospitality.com'
    		},
    		{
    			name: 'Holiday Inn Express & Suites Potsdam',
    			room: 40,
    			keyword: 'EUSUHM 2024',
    			contact: 'info@hiex-potsdam.de'
    		},
    		{
    			name: 'Nh Hotel Potsdam',
    			room: 30,
    			keyword: 'EUSUHM 2024',
    			contact: 'reservierungen@nh-hotels.com'
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Accomodation> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Contact, hotels });

    	$$self.$inject_state = $$props => {
    		if ('hotels' in $$props) $$invalidate(0, hotels = $$props.hotels);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hotels];
    }

    class Accomodation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Accomodation",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\About.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\About.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	child_ctx[2] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (39:10) {#each topics as topic}
    function create_each_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t0_value = /*topic*/ ctx[3] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(p, "class", "eus-text-xxlarge uk-margin-remove");
    			add_location(p, file$3, 41, 16, 2284);
    			attr_dev(div0, "class", "eus-height-300 uk-card uk-card-hover uk-card-body uk-card-small uk-background-default uk-flex uk-flex-middle uk-flex-center");
    			add_location(div0, file$3, 40, 14, 2129);
    			attr_dev(div1, "class", "eus-clip");
    			add_location(div1, file$3, 39, 12, 2091);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(39:10) {#each topics as topic}",
    		ctx
    	});

    	return block;
    }

    // (57:8) {#each objectives as objective, i}
    function create_each_block$3(ctx) {
    	let div1;
    	let div0;
    	let h2;
    	let t0_value = /*objective*/ ctx[0] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(h2, "class", "uk-text-bold");
    			add_location(h2, file$3, 61, 14, 3162);
    			set_style(div0, "background-color", euscolors[(2 + /*i*/ ctx[2]) % (euscolors.length - 1)]);
    			attr_dev(div0, "class", "uk-text-center uk-card uk-card-body uk-flex uk-flex-middle uk-flex-center");
    			add_location(div0, file$3, 60, 12, 2990);
    			attr_dev(div1, "class", "eus-clip");
    			add_location(div1, file$3, 57, 10, 2769);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			append_dev(div1, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(57:8) {#each objectives as objective, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let main;
    	let article0;
    	let h2;
    	let t0;
    	let a0;
    	let t2;
    	let span0;
    	let t4;
    	let span1;
    	let t6;
    	let p0;
    	let t8;
    	let div1;
    	let section0;
    	let article1;
    	let h10;
    	let t10;
    	let div0;
    	let t11;
    	let section1;
    	let article2;
    	let h11;
    	let t13;
    	let div2;
    	let t14;
    	let section2;
    	let article3;
    	let h12;
    	let t16;
    	let p1;
    	let t17;
    	let a1;
    	let t19;
    	let a2;
    	let t21;
    	let a3;
    	let t23;
    	let t24;
    	let h13;
    	let t26;
    	let p2;
    	let t27;
    	let a4;
    	let t29;
    	let a5;
    	let t31;
    	let a6;
    	let t33;
    	let h14;
    	let t35;
    	let div6;
    	let div3;
    	let strong0;
    	let t37;
    	let br0;
    	let t38;
    	let t39;
    	let div4;
    	let strong1;
    	let t41;
    	let br1;
    	let t42;
    	let strong2;
    	let t44;
    	let br2;
    	let t45;
    	let t46;
    	let div5;
    	let strong3;
    	let t48;
    	let br3;
    	let t49;
    	let each_value_1 = topics;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = objectives;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			article0 = element("article");
    			h2 = element("h2");
    			t0 = text("The European Union for School and University Health and Medicine (");
    			a0 = element("a");
    			a0.textContent = "EUSUHM";
    			t2 = text(")\r\n            invites you to the 22nd Congress on\r\n            ");
    			span0 = element("span");
    			span0.textContent = "Sustainable Health in Children and Students — Reduce the GAP!";
    			t4 = text("\r\n            in\r\n            ");
    			span1 = element("span");
    			span1.textContent = "Potsdam, Germany.";
    			t6 = space();
    			p0 = element("p");
    			p0.textContent = "The congress focuses on the disparities in health and healthcare access among European children and adolescents, taking into account the multiple impacts of the pandemic. It will explore numerous health-related initiatives and programmes carried out in learning environments, primarily focusing on educational institutions.";
    			t8 = space();
    			div1 = element("div");
    			section0 = element("section");
    			article1 = element("article");
    			h10 = element("h1");
    			h10.textContent = "Programme Highlights";
    			t10 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t11 = space();
    			section1 = element("section");
    			article2 = element("article");
    			h11 = element("h1");
    			h11.textContent = "Objectives of the congress";
    			t13 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t14 = space();
    			section2 = element("section");
    			article3 = element("article");
    			h12 = element("h1");
    			h12.textContent = "Location";
    			t16 = space();
    			p1 = element("p");
    			t17 = text("The 22nd EUSUHM congress will take place in the ");
    			a1 = element("a");
    			a1.textContent = "Oberlin-Schule Potsdam";
    			t19 = text(",\r\n            which is a dedicated educational and living space for children and adolescents\r\n            with diverse disabilities. ");
    			a2 = element("a");
    			a2.textContent = "Potsdam";
    			t21 = text(" is home to several UNESCO World Heritage Sites,\r\n            including Sanssouci Palace, a symbol of the Age of Enlightenment,\r\n            and the ");
    			a3 = element("a");
    			a3.textContent = "Cecilienhof";
    			t23 = text(", where the post-World War II Europe was restructured.");
    			t24 = space();
    			h13 = element("h1");
    			h13.textContent = "Cooperating Partners";
    			t26 = space();
    			p2 = element("p");
    			t27 = text("The EUSUHM congress and scientific Programme is set up in close cooperation with the\r\n            German Federal Association of Doctors in the Public Health Service ");
    			a4 = element("a");
    			a4.textContent = "(BVÖGD),";
    			t29 = text("\r\n            the German Association of Public Health ");
    			a5 = element("a");
    			a5.textContent = "(DGÖG)";
    			t31 = text("\r\n            and the \r\n            Swiss Association of Specialists in School Health Services ");
    			a6 = element("a");
    			a6.textContent = "(SCOLARMED).";
    			t33 = space();
    			h14 = element("h1");
    			h14.textContent = "Looking forward to seeing you";
    			t35 = space();
    			div6 = element("div");
    			div3 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Gabriele Ellsaesser";
    			t37 = space();
    			br0 = element("br");
    			t38 = text("\r\n            EUSUHM, president");
    			t39 = space();
    			div4 = element("div");
    			strong1 = element("strong");
    			strong1.textContent = "Susanne Stronski";
    			t41 = space();
    			br1 = element("br");
    			t42 = space();
    			strong2 = element("strong");
    			strong2.textContent = "Tina Huber-Gieseke";
    			t44 = space();
    			br2 = element("br");
    			t45 = text("\r\n            SCOLARMED, co-presidents");
    			t46 = space();
    			div5 = element("div");
    			strong3 = element("strong");
    			strong3.textContent = "Johannes Nießen";
    			t48 = space();
    			br3 = element("br");
    			t49 = text("\r\n            BVÖGD, chair");
    			attr_dev(a0, "class", "uk-link-muted");
    			attr_dev(a0, "href", "https://eusuhm.org/");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noopener");
    			add_location(a0, file$3, 12, 78, 424);
    			attr_dev(span0, "class", "uk-text-bolder");
    			add_location(span0, file$3, 14, 12, 581);
    			attr_dev(span1, "class", "uk-text-bolder");
    			add_location(span1, file$3, 16, 12, 708);
    			attr_dev(h2, "class", "eus-transform-none");
    			add_location(h2, file$3, 11, 8, 313);
    			attr_dev(p0, "class", "uk-text-lead");
    			add_location(p0, file$3, 23, 8, 1200);
    			attr_dev(article0, "id", "about");
    			attr_dev(article0, "class", "uk-padding uk-margin-xlarge");
    			add_location(article0, file$3, 9, 4, 197);
    			attr_dev(h10, "class", "uk-text-center uk-heading-large");
    			add_location(h10, file$3, 34, 8, 1797);
    			attr_dev(div0, "class", "uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-text-center uk-grid-match uk-margin-large-top");
    			attr_dev(div0, "uk-grid", "");
    			add_location(div0, file$3, 37, 8, 1908);
    			attr_dev(article1, "class", "uk-margin-large");
    			add_location(article1, file$3, 33, 6, 1754);
    			attr_dev(section0, "class", "eus-background-prime uk-background-muted uk-padding uk-margin-xlarge");
    			add_location(section0, file$3, 32, 4, 1660);
    			attr_dev(div1, "class", "eus-clip");
    			add_location(div1, file$3, 31, 2, 1632);
    			attr_dev(h11, "class", "uk-text-center uk-margin-large-top uk-heading-small");
    			add_location(h11, file$3, 54, 6, 2526);
    			attr_dev(div2, "class", "uk-grid uk-grid-match uk-child-width-1-3@s uk-margin-large-top");
    			attr_dev(div2, "uk-grid", "");
    			add_location(div2, file$3, 55, 6, 2629);
    			add_location(article2, file$3, 53, 4, 2509);
    			attr_dev(section1, "class", "uk-padding");
    			add_location(section1, file$3, 52, 2, 2475);
    			attr_dev(h12, "class", "uk-text-center uk-margin-large-top uk-heading-small");
    			add_location(h12, file$3, 72, 8, 3422);
    			attr_dev(a1, "class", "uk-link-muted");
    			attr_dev(a1, "href", "https://oberlin-schule.de/");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noopener");
    			add_location(a1, file$3, 74, 60, 3596);
    			attr_dev(a2, "class", "uk-link-muted");
    			attr_dev(a2, "href", "https://www.potsdam-tourism.com/en/home");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "rel", "noopener");
    			add_location(a2, file$3, 76, 39, 3846);
    			attr_dev(a3, "class", "uk-link-muted");
    			attr_dev(a3, "href", "https://www.spsg.de/schloesser-gaerten/objekt/schloss-cecilienhof/");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "rel", "noopener");
    			add_location(a3, file$3, 78, 20, 4109);
    			attr_dev(p1, "class", "uk-text-large");
    			add_location(p1, file$3, 73, 8, 3509);
    			attr_dev(h13, "class", "uk-text-center uk-margin-large-top uk-heading-small");
    			add_location(h13, file$3, 80, 8, 4332);
    			attr_dev(a4, "class", "uk-link-muted");
    			attr_dev(a4, "href", "https://www.bvoegd.de/");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "rel", "noopener");
    			add_location(a4, file$3, 83, 79, 4635);
    			attr_dev(a5, "class", "uk-link-muted");
    			attr_dev(a5, "href", "https://www.dgoeg.de/");
    			attr_dev(a5, "target", "_blank");
    			attr_dev(a5, "rel", "noopener");
    			add_location(a5, file$3, 84, 52, 4788);
    			attr_dev(a6, "class", "uk-link-muted");
    			attr_dev(a6, "href", "https://www.scolarmed.ch/index.php/de/");
    			attr_dev(a6, "target", "_blank");
    			attr_dev(a6, "rel", "noopener");
    			add_location(a6, file$3, 86, 76, 4984);
    			attr_dev(p2, "class", "uk-text-large");
    			add_location(p2, file$3, 81, 8, 4431);
    			attr_dev(h14, "class", "uk-heading-small uk-text-center uk-margin-large uk-padding-large");
    			add_location(h14, file$3, 88, 8, 5126);
    			add_location(article3, file$3, 71, 4, 3403);
    			add_location(strong0, file$3, 94, 12, 5399);
    			add_location(br0, file$3, 95, 12, 5449);
    			add_location(div3, file$3, 93, 8, 5380);
    			add_location(strong1, file$3, 99, 12, 5529);
    			add_location(br1, file$3, 100, 12, 5576);
    			add_location(strong2, file$3, 101, 12, 5594);
    			add_location(br2, file$3, 102, 12, 5643);
    			add_location(div4, file$3, 98, 8, 5510);
    			add_location(strong3, file$3, 106, 12, 5730);
    			add_location(br3, file$3, 107, 12, 5776);
    			add_location(div5, file$3, 105, 8, 5711);
    			attr_dev(div6, "class", "uk-grid uk-child-width-1-3@s uk-text-center uk-margin-bottom");
    			attr_dev(div6, "uk-grid", "");
    			add_location(div6, file$3, 92, 4, 5288);
    			attr_dev(section2, "class", "uk-padding uk-margin-xlarge-bottom");
    			add_location(section2, file$3, 70, 0, 3345);
    			attr_dev(main, "class", "uk-container");
    			add_location(main, file$3, 6, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, article0);
    			append_dev(article0, h2);
    			append_dev(h2, t0);
    			append_dev(h2, a0);
    			append_dev(h2, t2);
    			append_dev(h2, span0);
    			append_dev(h2, t4);
    			append_dev(h2, span1);
    			append_dev(article0, t6);
    			append_dev(article0, p0);
    			append_dev(main, t8);
    			append_dev(main, div1);
    			append_dev(div1, section0);
    			append_dev(section0, article1);
    			append_dev(article1, h10);
    			append_dev(article1, t10);
    			append_dev(article1, div0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				if (each_blocks_1[i]) {
    					each_blocks_1[i].m(div0, null);
    				}
    			}

    			append_dev(main, t11);
    			append_dev(main, section1);
    			append_dev(section1, article2);
    			append_dev(article2, h11);
    			append_dev(article2, t13);
    			append_dev(article2, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div2, null);
    				}
    			}

    			append_dev(main, t14);
    			append_dev(main, section2);
    			append_dev(section2, article3);
    			append_dev(article3, h12);
    			append_dev(article3, t16);
    			append_dev(article3, p1);
    			append_dev(p1, t17);
    			append_dev(p1, a1);
    			append_dev(p1, t19);
    			append_dev(p1, a2);
    			append_dev(p1, t21);
    			append_dev(p1, a3);
    			append_dev(p1, t23);
    			append_dev(article3, t24);
    			append_dev(article3, h13);
    			append_dev(article3, t26);
    			append_dev(article3, p2);
    			append_dev(p2, t27);
    			append_dev(p2, a4);
    			append_dev(p2, t29);
    			append_dev(p2, a5);
    			append_dev(p2, t31);
    			append_dev(p2, a6);
    			append_dev(article3, t33);
    			append_dev(article3, h14);
    			append_dev(section2, t35);
    			append_dev(section2, div6);
    			append_dev(div6, div3);
    			append_dev(div3, strong0);
    			append_dev(div3, t37);
    			append_dev(div3, br0);
    			append_dev(div3, t38);
    			append_dev(div6, t39);
    			append_dev(div6, div4);
    			append_dev(div4, strong1);
    			append_dev(div4, t41);
    			append_dev(div4, br1);
    			append_dev(div4, t42);
    			append_dev(div4, strong2);
    			append_dev(div4, t44);
    			append_dev(div4, br2);
    			append_dev(div4, t45);
    			append_dev(div6, t46);
    			append_dev(div6, div5);
    			append_dev(div5, strong3);
    			append_dev(div5, t48);
    			append_dev(div5, br3);
    			append_dev(div5, t49);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*topics*/ 0) {
    				each_value_1 = topics;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*euscolors, objectives*/ 0) {
    				each_value = objectives;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('About', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		objectives,
    		topics,
    		euscolors,
    		topbuttons
    	});

    	return [];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\Jumbotron.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\Jumbotron.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[0] = list[i];
    	child_ctx[2] = i;
    	return child_ctx;
    }

    // (30:14) {#if button.label2}
    function create_if_block$2(ctx) {
    	let p;
    	let t_value = /*button*/ ctx[0].label2 + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			set_style(p, "color", "black");
    			set_style(p, "margin", "5px 0 0 0");
    			set_style(p, "padding", "0");
    			set_style(p, "opacity", "0.5");
    			add_location(p, file$2, 30, 17, 2007);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(30:14) {#if button.label2}",
    		ctx
    	});

    	return block;
    }

    // (23:6) {#each topbuttons as button, i}
    function create_each_block$2(ctx) {
    	let div1;
    	let a;
    	let div0;
    	let h3;
    	let t0_value = /*button*/ ctx[0].label + "";
    	let t0;
    	let t1;
    	let t2;
    	let if_block = /*button*/ ctx[0].label2 && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			a = element("a");
    			div0 = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			set_style(h3, "padding", "0");
    			set_style(h3, "margin", "0");
    			attr_dev(h3, "class", "eus-line-height-1");
    			add_location(h3, file$2, 28, 14, 1874);
    			set_style(div0, "background-color", euscolors[(2 + /*i*/ ctx[2]) % (euscolors.length - 1)]);
    			attr_dev(div0, "class", "uk-height-small uk-text-center uk-card uk-card-body uk-flex uk-flex-column uk-flex-middle uk-flex-center");
    			add_location(div0, file$2, 27, 12, 1671);
    			attr_dev(a, "href", /*button*/ ctx[0].url);
    			attr_dev(a, "rel", "noopener");

    			attr_dev(a, "target", /*button*/ ctx[0].label === "Abstract Submission"
    			? '_self'
    			: '_blank');

    			add_location(a, file$2, 26, 10, 1548);
    			attr_dev(div1, "class", "eus-clip eus-topbutton");
    			add_location(div1, file$2, 23, 8, 1319);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, a);
    			append_dev(a, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t0);
    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (/*button*/ ctx[0].label2) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(23:6) {#each topbuttons as button, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let article0;
    	let h2;
    	let t1;
    	let section0;
    	let div0;
    	let p;
    	let t3;
    	let h1;
    	let t5;
    	let h3;
    	let t7;
    	let section1;
    	let article1;
    	let div1;
    	let each_value = topbuttons;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			article0 = element("article");
    			h2 = element("h2");
    			h2.textContent = "Sustainable Health in Children and Students — Reduce the GAP!";
    			t1 = space();
    			section0 = element("section");
    			div0 = element("div");
    			p = element("p");
    			p.textContent = "Congress Announcement";
    			t3 = space();
    			h1 = element("h1");
    			h1.textContent = "22nd EUSUHM Congress";
    			t5 = space();
    			h3 = element("h3");
    			h3.textContent = "3rd to 5th of October 2024";
    			t7 = space();
    			section1 = element("section");
    			article1 = element("article");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "id", "eus-smallhead");
    			add_location(h2, file$2, 9, 4, 243);
    			attr_dev(article0, "id", "");
    			attr_dev(article0, "class", "uk-article uk-padding-remove-bottom");
    			add_location(article0, file$2, 8, 2, 178);
    			set_style(p, "padding", "0");
    			set_style(p, "margin", "0");
    			add_location(p, file$2, 13, 6, 672);
    			set_style(h1, "padding", "0");
    			set_style(h1, "margin", "0");
    			attr_dev(h1, "class", "uk-heading-large");
    			add_location(h1, file$2, 14, 6, 739);
    			set_style(h3, "padding", "0");
    			set_style(h3, "margin", "0");
    			attr_dev(h3, "class", "eus-transform-none");
    			add_location(h3, file$2, 15, 6, 833);
    			set_style(div0, "max-width", "100%");
    			set_style(div0, "margin", "60px 30px");
    			set_style(div0, "padding", "60px 0");
    			attr_dev(div0, "class", "eus-clip uk-card uk-card-body uk-background-primary uk-padding-small");
    			add_location(div0, file$2, 12, 4, 522);
    			attr_dev(section0, "id", "jumbotron");
    			attr_dev(section0, "class", "eus-potsdam-bg uk-section uk-section-primary uk-text-center uk-light eus-background-prime uk-padding-remove-top");
    			add_location(section0, file$2, 11, 0, 371);
    			attr_dev(div1, "class", "uk-grid uk-grid-match uk-child-width-1-3@s uk-padding");
    			attr_dev(div1, "uk-grid", "");
    			add_location(div1, file$2, 21, 4, 1195);
    			attr_dev(article1, "class", "");
    			add_location(article1, file$2, 20, 2, 1171);
    			set_style(section1, "position", "relative");
    			set_style(section1, "top", "-100px");
    			attr_dev(section1, "class", "");
    			add_location(section1, file$2, 19, 0, 1111);
    			attr_dev(main, "class", "uk-container");
    			add_location(main, file$2, 6, 0, 122);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, article0);
    			append_dev(article0, h2);
    			append_dev(main, t1);
    			append_dev(main, section0);
    			append_dev(section0, div0);
    			append_dev(div0, p);
    			append_dev(div0, t3);
    			append_dev(div0, h1);
    			append_dev(div0, t5);
    			append_dev(div0, h3);
    			append_dev(main, t7);
    			append_dev(main, section1);
    			append_dev(section1, article1);
    			append_dev(article1, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*topbuttons, euscolors*/ 0) {
    				each_value = topbuttons;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Jumbotron', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Jumbotron> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		objectives,
    		topics,
    		euscolors,
    		topbuttons
    	});

    	return [];
    }

    class Jumbotron extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Jumbotron",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\maintopics.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\maintopics.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	child_ctx[3] = i;
    	return child_ctx;
    }

    // (12:10) {#each $hottopics as topic, i}
    function create_each_block$1(ctx) {
    	let div1;
    	let div0;
    	let p;
    	let t0_value = /*topic*/ ctx[1] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(p, "class", "eus-text-xxlarge uk-margin-remove");
    			add_location(p, file$1, 14, 16, 776);
    			set_style(div0, "background-color", euscolors[(2 + /*i*/ ctx[3]) % (euscolors.length - 1)]);
    			set_style(div0, "color", "black");
    			attr_dev(div0, "class", "eus-height-300 uk-card uk-card-hover uk-card-body uk-card-small uk-flex uk-flex-middle uk-flex-center");
    			add_location(div0, file$1, 13, 14, 559);
    			attr_dev(div1, "class", "eus-clip");
    			add_location(div1, file$1, 12, 12, 521);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div1, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$hottopics*/ 1 && t0_value !== (t0_value = /*topic*/ ctx[1] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(12:10) {#each $hottopics as topic, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let article;
    	let h1;
    	let t1;
    	let div0;
    	let each_value = /*$hottopics*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			article = element("article");
    			h1 = element("h1");
    			h1.textContent = "Our Main Topics in 2024";
    			t1 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "uk-text-center uk-heading-large eus-transform-none");
    			add_location(h1, file$1, 7, 8, 198);
    			attr_dev(div0, "class", "uk-grid uk-grid-small uk-child-width-1-2@s uk-child-width-1-3@m uk-text-center uk-grid-match uk-margin-large-top");
    			attr_dev(div0, "uk-grid", "");
    			add_location(div0, file$1, 10, 8, 331);
    			attr_dev(article, "class", "uk-margin-large");
    			add_location(article, file$1, 6, 4, 155);
    			attr_dev(div1, "class", "uk-container uk-padding-large");
    			add_location(div1, file$1, 5, 0, 106);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, article);
    			append_dev(article, h1);
    			append_dev(article, t1);
    			append_dev(article, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div0, null);
    				}
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*euscolors, $hottopics*/ 1) {
    				each_value = /*$hottopics*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $hottopics;
    	validate_store(hottopics, 'hottopics');
    	component_subscribe($$self, hottopics, $$value => $$invalidate(0, $hottopics = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Maintopics', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Maintopics> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ euscolors, hottopics, $hottopics });
    	return [$hottopics];
    }

    class Maintopics extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Maintopics",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\RegistrationFees.svelte generated by Svelte v3.59.2 */

    const { Object: Object_1 } = globals;
    const file = "src\\RegistrationFees.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i][0];
    	child_ctx[4] = list[i][1];
    	child_ctx[6] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i][0];
    	child_ctx[8] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i][0];
    	child_ctx[12] = list[i][1];
    	return child_ctx;
    }

    // (15:10) {#if index !== 0}
    function create_if_block$1(ctx) {
    	let div;
    	let if_block = /*section*/ ctx[3] == /*displayed*/ ctx[1] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div, "class", "");
    			add_location(div, file, 15, 12, 555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block) if_block.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*section*/ ctx[3] == /*displayed*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(15:10) {#if index !== 0}",
    		ctx
    	});

    	return block;
    }

    // (17:16) {#if section==displayed}
    function create_if_block_1$1(ctx) {
    	let t;
    	let ul;

    	function select_block_type(ctx, dirty) {
    		if (/*section*/ ctx[3] === 'Registration Fees') return create_if_block_2$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	let each_value_1 = Object.entries(/*details*/ ctx[4]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			if_block.c();
    			t = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "uk-list");
    			add_location(ul, file, 40, 20, 2266);
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(ul, null);
    				}
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t.parentNode, t);
    				}
    			}

    			if (dirty & /*Object, data*/ 1) {
    				each_value_1 = Object.entries(/*details*/ ctx[4]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(17:16) {#if section==displayed}",
    		ctx
    	});

    	return block;
    }

    // (38:18) {:else}
    function create_else_block$1(ctx) {
    	let h1;
    	let t_value = /*section*/ ctx[3] + "";
    	let t;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t = text(t_value);
    			add_location(h1, file, 38, 22, 2199);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t_value !== (t_value = /*section*/ ctx[3] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(38:18) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:18) {#if section==='Registration Fees'}
    function create_if_block_2$1(ctx) {
    	let h1;
    	let t0_value = /*section*/ ctx[3] + "";
    	let t0;
    	let t1;
    	let ul;
    	let li0;
    	let span0;
    	let t2;
    	let div0;
    	let span1;
    	let t4;
    	let span2;
    	let t6;
    	let span3;
    	let t8;
    	let li1;
    	let span4;
    	let t9;
    	let div1;
    	let span5;
    	let t11;
    	let span6;
    	let t13;
    	let span7;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			span0 = element("span");
    			t2 = space();
    			div0 = element("div");
    			span1 = element("span");
    			span1.textContent = "Early";
    			t4 = space();
    			span2 = element("span");
    			span2.textContent = "Regular";
    			t6 = space();
    			span3 = element("span");
    			span3.textContent = "Late";
    			t8 = space();
    			li1 = element("li");
    			span4 = element("span");
    			t9 = space();
    			div1 = element("div");
    			span5 = element("span");
    			span5.textContent = "Early Rate until 1st July 2024";
    			t11 = space();
    			span6 = element("span");
    			span6.textContent = "Regular Rate";
    			t13 = space();
    			span7 = element("span");
    			span7.textContent = "Late Rate after 1st September 2024";
    			attr_dev(h1, "class", "uk-heading-small");
    			add_location(h1, file, 18, 22, 690);
    			attr_dev(span0, "class", "eus-fee eus-fee-title eus-fee-spacer");
    			set_style(span0, "width", "257px");
    			add_location(span0, file, 21, 30, 890);
    			attr_dev(span1, "class", "eus-fee eus-fee-title");
    			add_location(span1, file, 23, 34, 1070);
    			attr_dev(span2, "class", "eus-fee eus-fee-title");
    			add_location(span2, file, 24, 34, 1155);
    			attr_dev(span3, "class", "eus-fee eus-fee-title");
    			add_location(span3, file, 25, 34, 1242);
    			set_style(div0, "display", "inline-block");
    			add_location(div0, file, 22, 30, 1000);
    			attr_dev(li0, "class", "uk-padding-bottom-remove");
    			add_location(li0, file, 20, 26, 821);
    			attr_dev(span4, "class", "eus-fee eus-fee-title eus-fee-spacer");
    			set_style(span4, "line-height", "0px");
    			set_style(span4, "padding-bottom", "0");
    			add_location(span4, file, 29, 30, 1468);
    			attr_dev(span5, "class", "eus-fee eus-fee-title eus-fee-details uk-text-top");
    			add_location(span5, file, 31, 34, 1672);
    			attr_dev(span6, "class", "eus-fee eus-fee-title eus-fee-details uk-text-top");
    			add_location(span6, file, 32, 34, 1814);
    			attr_dev(span7, "class", "eus-fee eus-fee-title eus-fee-details uk-text-top");
    			add_location(span7, file, 33, 34, 1933);
    			set_style(div1, "display", "inline-block");
    			add_location(div1, file, 30, 30, 1602);
    			attr_dev(li1, "class", "uk-text-small");
    			set_style(li1, "margin-top", "0");
    			add_location(li1, file, 28, 26, 1389);
    			attr_dev(ul, "class", "uk-list uk-text-large");
    			add_location(ul, file, 19, 22, 759);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			append_dev(h1, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, span0);
    			append_dev(li0, t2);
    			append_dev(li0, div0);
    			append_dev(div0, span1);
    			append_dev(div0, t4);
    			append_dev(div0, span2);
    			append_dev(div0, t6);
    			append_dev(div0, span3);
    			append_dev(ul, t8);
    			append_dev(ul, li1);
    			append_dev(li1, span4);
    			append_dev(li1, t9);
    			append_dev(li1, div1);
    			append_dev(div1, span5);
    			append_dev(div1, t11);
    			append_dev(div1, span6);
    			append_dev(div1, t13);
    			append_dev(div1, span7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*section*/ ctx[3] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(18:18) {#if section==='Registration Fees'}",
    		ctx
    	});

    	return block;
    }

    // (46:38) {#each Object.entries(value) as [cat, prices]}
    function create_each_block_2(ctx) {
    	let span;
    	let t0_value = /*prices*/ ctx[12] + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text("  €");
    			attr_dev(span, "class", "eus-fee ");
    			add_location(span, file, 46, 42, 2720);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*prices*/ ctx[12] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(46:38) {#each Object.entries(value) as [cat, prices]}",
    		ctx
    	});

    	return block;
    }

    // (42:20) {#each Object.entries(details) as [key, value]}
    function create_each_block_1(ctx) {
    	let li;
    	let span;
    	let t0_value = /*key*/ ctx[7] + "";
    	let t0;
    	let t1;
    	let div;
    	let t2;
    	let br;
    	let each_value_2 = Object.entries(/*value*/ ctx[8]);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			br = element("br");
    			attr_dev(span, "class", "eus-fee eus-fee-title eus-fee-spacer uk-text-large");
    			add_location(span, file, 43, 34, 2427);
    			set_style(div, "display", "inline-block");
    			set_style(div, "margin-top", "5px");
    			add_location(div, file, 44, 34, 2540);
    			add_location(li, file, 42, 30, 2387);
    			add_location(br, file, 50, 30, 2933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, span);
    			append_dev(span, t0);
    			append_dev(li, t1);
    			append_dev(li, div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			insert_dev(target, t2, anchor);
    			insert_dev(target, br, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data*/ 1 && t0_value !== (t0_value = /*key*/ ctx[7] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*Object, data*/ 1) {
    				each_value_2 = Object.entries(/*value*/ ctx[8]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(42:20) {#each Object.entries(details) as [key, value]}",
    		ctx
    	});

    	return block;
    }

    // (14:6) {#each Object.entries(data) as [section, details], index}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let if_block = /*index*/ ctx[6] !== 0 && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[6] !== 0) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(14:6) {#each Object.entries(data) as [section, details], index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div;
    	let article;
    	let t0;
    	let h3;
    	let t2;
    	let p;
    	let t4;
    	let br;
    	let each_value = Object.entries(/*data*/ ctx[0]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			article = element("article");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			h3 = element("h3");
    			h3.textContent = "The registration fee includes";
    			t2 = space();
    			p = element("p");
    			p.textContent = "admission to all congress\r\n            sessions, poster and exhibition areas, congress materials (final\r\n            programme, book of abstracts, congress bag, ID card),\r\n            lunches, coffee breaks, welcome reception.";
    			t4 = space();
    			br = element("br");
    			add_location(h3, file, 58, 8, 3088);
    			set_style(p, "max-width", "600px");
    			add_location(p, file, 59, 8, 3136);
    			add_location(br, file, 64, 8, 3413);
    			attr_dev(article, "id", "registration-fees");
    			attr_dev(article, "class", "uk-article uk-padding-remove-top uk-padding-large");
    			add_location(article, file, 12, 4, 355);
    			attr_dev(div, "class", "uk-container uk-padding-remove-top");
    			add_location(div, file, 11, 4, 301);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, article);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(article, null);
    				}
    			}

    			append_dev(article, t0);
    			append_dev(article, h3);
    			append_dev(article, t2);
    			append_dev(article, p);
    			append_dev(article, t4);
    			append_dev(article, br);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*Object, data, displayed*/ 3) {
    				each_value = Object.entries(/*data*/ ctx[0]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(article, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let data;
    	let $congressData;
    	validate_store(congressData, 'congressData');
    	component_subscribe($$self, congressData, $$value => $$invalidate(2, $congressData = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('RegistrationFees', slots, []);
    	let displayed = 'Registration Fees';
    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<RegistrationFees> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		congressData,
    		displayed,
    		data,
    		$congressData
    	});

    	$$self.$inject_state = $$props => {
    		if ('displayed' in $$props) $$invalidate(1, displayed = $$props.displayed);
    		if ('data' in $$props) $$invalidate(0, data = $$props.data);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$congressData*/ 4) {
    			// Auto-Subscription des Svelte Stores
    			$$invalidate(0, data = $congressData);
    		}
    	};

    	return [data, displayed, $congressData];
    }

    class RegistrationFees extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "RegistrationFees",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;

    // (58:0) {:else}
    function create_else_block(ctx) {
    	let jumbotron;
    	let t0;
    	let landing;
    	let t1;
    	let footer;
    	let current;
    	jumbotron = new Jumbotron({ $$inline: true });
    	landing = new Landing({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(jumbotron.$$.fragment);
    			t0 = space();
    			create_component(landing.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(jumbotron, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(landing, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(jumbotron.$$.fragment, local);
    			transition_in(landing.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(jumbotron.$$.fragment, local);
    			transition_out(landing.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(jumbotron, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(landing, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(58:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (53:48) 
    function create_if_block_4(ctx) {
    	let registrationfees;
    	let t0;
    	let contact;
    	let t1;
    	let footer;
    	let current;
    	registrationfees = new RegistrationFees({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(registrationfees.$$.fragment);
    			t0 = space();
    			create_component(contact.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(registrationfees, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(contact, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(registrationfees.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(registrationfees.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(registrationfees, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(contact, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(53:48) ",
    		ctx
    	});

    	return block;
    }

    // (48:36) 
    function create_if_block_3(ctx) {
    	let about;
    	let t0;
    	let jumbotron;
    	let t1;
    	let footer;
    	let current;
    	about = new About({ $$inline: true });
    	jumbotron = new Jumbotron({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(about.$$.fragment);
    			t0 = space();
    			create_component(jumbotron.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(about, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(jumbotron, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(about.$$.fragment, local);
    			transition_in(jumbotron.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(about.$$.fragment, local);
    			transition_out(jumbotron.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(about, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(jumbotron, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(48:36) ",
    		ctx
    	});

    	return block;
    }

    // (43:43) 
    function create_if_block_2(ctx) {
    	let accomodation;
    	let t0;
    	let contact;
    	let t1;
    	let footer;
    	let current;
    	accomodation = new Accomodation({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(accomodation.$$.fragment);
    			t0 = space();
    			create_component(contact.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(accomodation, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(contact, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accomodation.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accomodation.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(accomodation, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(contact, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(43:43) ",
    		ctx
    	});

    	return block;
    }

    // (38:40) 
    function create_if_block_1(ctx) {
    	let maintopics;
    	let t0;
    	let programme;
    	let t1;
    	let footer;
    	let current;
    	maintopics = new Maintopics({ $$inline: true });
    	programme = new Programme({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(maintopics.$$.fragment);
    			t0 = space();
    			create_component(programme.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(maintopics, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(programme, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(maintopics.$$.fragment, local);
    			transition_in(programme.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(maintopics.$$.fragment, local);
    			transition_out(programme.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(maintopics, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(programme, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(38:40) ",
    		ctx
    	});

    	return block;
    }

    // (33:0) {#if currentRoute === '/submit'}
    function create_if_block(ctx) {
    	let submit;
    	let t0;
    	let contact;
    	let t1;
    	let footer;
    	let current;
    	submit = new Submit({ $$inline: true });
    	contact = new Contact({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(submit.$$.fragment);
    			t0 = space();
    			create_component(contact.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(submit, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(contact, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(submit.$$.fragment, local);
    			transition_in(contact.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(submit.$$.fragment, local);
    			transition_out(contact.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(submit, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(contact, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(33:0) {#if currentRoute === '/submit'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let navbar;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	navbar = new Navbar({ $$inline: true });

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_else_block
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*currentRoute*/ ctx[0] === '/submit') return 0;
    		if (/*currentRoute*/ ctx[0] === '/programme') return 1;
    		if (/*currentRoute*/ ctx[0] === '/accomodation') return 2;
    		if (/*currentRoute*/ ctx[0] === '/about') return 3;
    		if (/*currentRoute*/ ctx[0] === '/registrationfees') return 4;
    		return 5;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			create_component(navbar.$$.fragment);
    			t = space();
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navbar, target, anchor);
    			insert_dev(target, t, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navbar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navbar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navbar, detaching);
    			if (detaching) detach_dev(t);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let currentRoute = window.location.pathname;

    	// This will run when the component mounts
    	onMount(() => {
    		console.log("Initial currentRoute: ", currentRoute); // Debugging line

    		window.addEventListener('popstate', () => {
    			$$invalidate(0, currentRoute = window.location.pathname);
    			console.log("Updated currentRoute: ", currentRoute); // Debugging line
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		Navbar,
    		Contact,
    		Footer,
    		Landing,
    		Submit,
    		Programme,
    		Accomodation,
    		About,
    		Jumbotron,
    		Maintopics,
    		RegistrationFees,
    		currentRoute
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentRoute' in $$props) $$invalidate(0, currentRoute = $$props.currentRoute);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [currentRoute];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    var uikit_min = {exports: {}};

    /*! UIkit 3.16.26 | https://www.getuikit.com | (c) 2014 - 2023 YOOtheme | MIT License */

    (function (module, exports) {
    	(function(ve,we){module.exports=we();})(commonjsGlobal,function(){const{hasOwnProperty:ve,toString:we}=Object.prototype;function vt(t,e){return ve.call(t,e)}const Fo=/\B([A-Z])/g,Kt=dt(t=>t.replace(Fo,"-$1").toLowerCase()),Ho=/-(\w)/g,be=dt(t=>(t.charAt(0).toLowerCase()+t.slice(1)).replace(Ho,(e,i)=>i.toUpperCase())),Tt=dt(t=>t.charAt(0).toUpperCase()+t.slice(1));function ot(t,e){var i;return (i=t==null?void 0:t.startsWith)==null?void 0:i.call(t,e)}function Zt(t,e){var i;return (i=t==null?void 0:t.endsWith)==null?void 0:i.call(t,e)}function m(t,e){var i;return (i=t==null?void 0:t.includes)==null?void 0:i.call(t,e)}function xt(t,e){var i;return (i=t==null?void 0:t.findIndex)==null?void 0:i.call(t,e)}const{isArray:Q,from:Qt}=Array,{assign:wt}=Object;function it(t){return typeof t=="function"}function Et(t){return t!==null&&typeof t=="object"}function yt(t){return we.call(t)==="[object Object]"}function te(t){return Et(t)&&t===t.window}function Ge(t){return Di(t)===9}function Xe(t){return Di(t)>=1}function ee(t){return Di(t)===1}function Di(t){return !te(t)&&Et(t)&&t.nodeType}function ie(t){return typeof t=="boolean"}function D(t){return typeof t=="string"}function $e(t){return typeof t=="number"}function bt(t){return $e(t)||D(t)&&!isNaN(t-parseFloat(t))}function xe(t){return !(Q(t)?t.length:Et(t)&&Object.keys(t).length)}function Y(t){return t===void 0}function Bi(t){return ie(t)?t:t==="true"||t==="1"||t===""?!0:t==="false"||t==="0"?!1:t}function kt(t){const e=Number(t);return isNaN(e)?!1:e}function $(t){return parseFloat(t)||0}function H(t){return k(t)[0]}function k(t){return Xe(t)?[t]:Array.from(t||[]).filter(Xe)}function se(t){if(te(t))return t;t=H(t);const e=Ge(t)?t:t==null?void 0:t.ownerDocument;return (e==null?void 0:e.defaultView)||window}function Je(t,e){return t===e||Et(t)&&Et(e)&&Object.keys(t).length===Object.keys(e).length&&Pt(t,(i,s)=>i===e[s])}function Mi(t,e,i){return t.replace(new RegExp(`${e}|${i}`,"g"),s=>s===e?i:e)}function ne(t){return t[t.length-1]}function Pt(t,e){for(const i in t)if(e(t[i],i)===!1)return !1;return !0}function Ke(t,e){return t.slice().sort(({[e]:i=0},{[e]:s=0})=>i>s?1:s>i?-1:0)}function Dt(t,e){return t.reduce((i,s)=>i+$(it(e)?e(s):s[e]),0)}function _s(t,e){const i=new Set;return t.filter(({[e]:s})=>i.has(s)?!1:i.add(s))}function Ni(t,e){return e.reduce((i,s)=>({...i,[s]:t[s]}),{})}function Z(t,e=0,i=1){return Math.min(Math.max(kt(t)||0,e),i)}function S(){}function zi(...t){return [["bottom","top"],["right","left"]].every(([e,i])=>Math.min(...t.map(({[e]:s})=>s))-Math.max(...t.map(({[i]:s})=>s))>0)}function Ze(t,e){return t.x<=e.right&&t.x>=e.left&&t.y<=e.bottom&&t.y>=e.top}function Fi(t,e,i){const s=e==="width"?"height":"width";return {[s]:t[e]?Math.round(i*t[s]/t[e]):t[s],[e]:i}}function As(t,e){t={...t};for(const i in t)t=t[i]>e[i]?Fi(t,i,e[i]):t;return t}function Lo(t,e){t=As(t,e);for(const i in t)t=t[i]<e[i]?Fi(t,i,e[i]):t;return t}const Qe={ratio:Fi,contain:As,cover:Lo};function rt(t,e,i=0,s=!1){e=k(e);const{length:n}=e;return n?(t=bt(t)?kt(t):t==="next"?i+1:t==="previous"?i-1:t==="last"?n-1:e.indexOf(H(t)),s?Z(t,0,n-1):(t%=n,t<0?t+n:t)):-1}function dt(t){const e=Object.create(null);return i=>e[i]||(e[i]=t(i))}function p(t,e,i){var s;if(Et(e)){for(const n in e)p(t,n,e[n]);return}if(Y(i))return (s=H(t))==null?void 0:s.getAttribute(e);for(const n of k(t))it(i)&&(i=i.call(n,p(n,e))),i===null?ye(n,e):n.setAttribute(e,i);}function $t(t,e){return k(t).some(i=>i.hasAttribute(e))}function ye(t,e){k(t).forEach(i=>i.removeAttribute(e));}function tt(t,e){for(const i of [e,`data-${e}`])if($t(t,i))return p(t,i)}function y(t,...e){Os(t,e,"add");}function M(t,...e){Os(t,e,"remove");}function Hi(t,e){p(t,"class",i=>(i||"").replace(new RegExp(`\\b${e}\\b\\s?`,"g"),""));}function Li(t,...e){e[0]&&M(t,e[0]),e[1]&&y(t,e[1]);}function P(t,e){return [e]=Wi(e),!!e&&k(t).some(i=>i.classList.contains(e))}function q(t,e,i){const s=Wi(e);Y(i)||(i=!!i);for(const n of k(t))for(const o of s)n.classList.toggle(o,i);}function Os(t,e,i){e=e.reduce((s,n)=>s.concat(Wi(n)),[]);for(const s of k(t))s.classList[i](...e);}function Wi(t){return String(t).split(/[ ,]/).filter(Boolean)}const Wo={area:!0,base:!0,br:!0,col:!0,embed:!0,hr:!0,img:!0,input:!0,keygen:!0,link:!0,meta:!0,param:!0,source:!0,track:!0,wbr:!0};function Ri(t){return k(t).some(e=>Wo[e.tagName.toLowerCase()])}function R(t){return k(t).some(e=>e.offsetWidth||e.offsetHeight||e.getClientRects().length)}const ke="input,select,textarea,button";function ji(t){return k(t).some(e=>C(e,ke))}const Se=`${ke},a[href],[tabindex]`;function ti(t){return C(t,Se)}function _(t){var e;return (e=H(t))==null?void 0:e.parentElement}function Ie(t,e){return k(t).filter(i=>C(i,e))}function C(t,e){return k(t).some(i=>i.matches(e))}function U(t,e){return ee(t)?t.closest(ot(e,">")?e.slice(1):e):k(t).map(i=>U(i,e)).filter(Boolean)}function B(t,e){return D(e)?!!U(t,e):H(e).contains(H(t))}function oe(t,e){const i=[];for(;t=_(t);)(!e||C(t,e))&&i.push(t);return i}function T(t,e){t=H(t);const i=t?Qt(t.children):[];return e?Ie(i,e):i}function re(t,e){return e?k(t).indexOf(H(e)):T(_(t)).indexOf(t)}function ae(t){return t=H(t),t&&["origin","pathname","search"].every(e=>t[e]===location[e])}function qi(t){if(ae(t)){t=H(t);const e=decodeURIComponent(t.hash).substring(1);return document.getElementById(e)||document.getElementsByName(e)[0]}}function at(t,e){return Ui(t,Bs(t,e))}function Ce(t,e){return Te(t,Bs(t,e))}function Ui(t,e){return H(Ms(t,H(e),"querySelector"))}function Te(t,e){return k(Ms(t,H(e),"querySelectorAll"))}const Ro=/(^|[^\\],)\s*[!>+~-]/,Ds=dt(t=>t.match(Ro));function Bs(t,e=document){return D(t)&&Ds(t)||Ge(e)?e:e.ownerDocument}const jo=/([!>+~-])(?=\s+[!>+~-]|\s*$)/g,qo=dt(t=>t.replace(jo,"$1 *"));function Ms(t,e=document,i){if(!t||!D(t))return t;if(t=qo(t),Ds(t)){const s=Vo(t);t="";for(let n of s){let o=e;if(n[0]==="!"){const r=n.substr(1).trim().split(" ");if(o=U(_(e),r[0]),n=r.slice(1).join(" ").trim(),!n.length&&s.length===1)return o}if(n[0]==="-"){const r=n.substr(1).trim().split(" "),a=(o||e).previousElementSibling;o=C(a,n.substr(1))?a:null,n=r.slice(1).join(" ");}o&&(t+=`${t?",":""}${Yo(o)} ${n}`);}e=document;}try{return e[i](t)}catch{return null}}const Uo=/.*?[^\\](?:,|$)/g,Vo=dt(t=>t.match(Uo).map(e=>e.replace(/,$/,"").trim()));function Yo(t){const e=[];for(;t.parentNode;){const i=p(t,"id");if(i){e.unshift(`#${Vi(i)}`);break}else {let{tagName:s}=t;s!=="HTML"&&(s+=`:nth-child(${re(t)+1})`),e.unshift(s),t=t.parentNode;}}return e.join(" > ")}function Vi(t){return D(t)?CSS.escape(t):""}function x(...t){let[e,i,s,n,o=!1]=Yi(t);n.length>1&&(n=Xo(n)),o!=null&&o.self&&(n=Jo(n)),s&&(n=Go(s,n));for(const r of i)for(const a of e)a.addEventListener(r,n,o);return ()=>Bt(e,i,n,o)}function Bt(...t){let[e,i,,s,n=!1]=Yi(t);for(const o of i)for(const r of e)r.removeEventListener(o,s,n);}function j(...t){const[e,i,s,n,o=!1,r]=Yi(t),a=x(e,i,s,l=>{const h=!r||r(l);h&&(a(),n(l,h));},o);return a}function v(t,e,i){return Gi(t).every(s=>s.dispatchEvent(Mt(e,!0,!0,i)))}function Mt(t,e=!0,i=!1,s){return D(t)&&(t=new CustomEvent(t,{bubbles:e,cancelable:i,detail:s})),t}function Yi(t){return t[0]=Gi(t[0]),D(t[1])&&(t[1]=t[1].split(" ")),it(t[2])&&t.splice(2,0,!1),t}function Go(t,e){return i=>{const s=t[0]===">"?Te(t,i.currentTarget).reverse().filter(n=>B(i.target,n))[0]:U(i.target,t);s&&(i.current=s,e.call(this,i),delete i.current);}}function Xo(t){return e=>Q(e.detail)?t(e,...e.detail):t(e)}function Jo(t){return function(e){if(e.target===e.currentTarget||e.target===e.current)return t.call(null,e)}}function Ns(t){return t&&"addEventListener"in t}function Ko(t){return Ns(t)?t:H(t)}function Gi(t){return Q(t)?t.map(Ko).filter(Boolean):D(t)?Te(t):Ns(t)?[t]:k(t)}function St(t){return t.pointerType==="touch"||!!t.touches}function le(t){var e,i;const{clientX:s,clientY:n}=((e=t.touches)==null?void 0:e[0])||((i=t.changedTouches)==null?void 0:i[0])||t;return {x:s,y:n}}const Zo={"animation-iteration-count":!0,"column-count":!0,"fill-opacity":!0,"flex-grow":!0,"flex-shrink":!0,"font-weight":!0,"line-height":!0,opacity:!0,order:!0,orphans:!0,"stroke-dasharray":!0,"stroke-dashoffset":!0,widows:!0,"z-index":!0,zoom:!0};function c(t,e,i,s){const n=k(t);for(const o of n)if(D(e)){if(e=ei(e),Y(i))return getComputedStyle(o).getPropertyValue(e);o.style.setProperty(e,bt(i)&&!Zo[e]?`${i}px`:i||$e(i)?i:"",s);}else if(Q(e)){const r={};for(const a of e)r[a]=c(o,a);return r}else Et(e)&&(s=i,Pt(e,(r,a)=>c(o,a,r,s)));return n[0]}const ei=dt(t=>Qo(t));function Qo(t){if(ot(t,"--"))return t;t=Kt(t);const{style:e}=document.documentElement;if(t in e)return t;for(const i of ["webkit","moz"]){const s=`-${i}-${t}`;if(s in e)return s}}function tr(t,e,i=400,s="linear"){return i=Math.round(i),Promise.all(k(t).map(n=>new Promise((o,r)=>{for(const l in e){const h=c(n,l);h===""&&c(n,l,h);}const a=setTimeout(()=>v(n,"transitionend"),i);j(n,"transitionend transitioncanceled",({type:l})=>{clearTimeout(a),M(n,"uk-transition"),c(n,{transitionProperty:"",transitionDuration:"",transitionTimingFunction:""}),l==="transitioncanceled"?r():o(n);},{self:!0}),y(n,"uk-transition"),c(n,{transitionProperty:Object.keys(e).map(ei).join(","),transitionDuration:`${i}ms`,transitionTimingFunction:s,...e});})))}const E={start:tr,async stop(t){v(t,"transitionend"),await Promise.resolve();},async cancel(t){v(t,"transitioncanceled"),await Promise.resolve();},inProgress(t){return P(t,"uk-transition")}},Ee="uk-animation-";function zs(t,e,i=200,s,n){return Promise.all(k(t).map(o=>new Promise((r,a)=>{v(o,"animationcanceled");const l=setTimeout(()=>v(o,"animationend"),i);j(o,"animationend animationcanceled",({type:h})=>{clearTimeout(l),h==="animationcanceled"?a():r(o),c(o,"animationDuration",""),Hi(o,`${Ee}\\S*`);},{self:!0}),c(o,"animationDuration",`${i}ms`),y(o,e,Ee+(n?"leave":"enter")),ot(e,Ee)&&(s&&y(o,`uk-transform-origin-${s}`),n&&y(o,`${Ee}reverse`));})))}const er=new RegExp(`${Ee}(enter|leave)`),gt={in:zs,out(t,e,i,s){return zs(t,e,i,s,!0)},inProgress(t){return er.test(p(t,"class"))},cancel(t){v(t,"animationcanceled");}};function ir(t){if(document.readyState!=="loading"){t();return}j(document,"DOMContentLoaded",t);}function G(t,...e){return e.some(i=>{var s;return ((s=t==null?void 0:t.tagName)==null?void 0:s.toLowerCase())===i.toLowerCase()})}function Xi(t){return t=w(t),t.innerHTML="",t}function Nt(t,e){return Y(e)?w(t).innerHTML:L(Xi(t),e)}const sr=ni("prepend"),L=ni("append"),ii=ni("before"),si=ni("after");function ni(t){return function(e,i){var s;const n=k(D(i)?zt(i):i);return (s=w(e))==null||s[t](...n),Fs(n)}}function lt(t){k(t).forEach(e=>e.remove());}function oi(t,e){for(e=H(ii(t,e));e.firstChild;)e=e.firstChild;return L(e,t),e}function Ji(t,e){return k(k(t).map(i=>i.hasChildNodes()?oi(Qt(i.childNodes),e):L(i,e)))}function Pe(t){k(t).map(_).filter((e,i,s)=>s.indexOf(e)===i).forEach(e=>e.replaceWith(...e.childNodes));}const nr=/^\s*<(\w+|!)[^>]*>/,or=/^<(\w+)\s*\/?>(?:<\/\1>)?$/;function zt(t){const e=or.exec(t);if(e)return document.createElement(e[1]);const i=document.createElement("div");return nr.test(t)?i.insertAdjacentHTML("beforeend",t.trim()):i.textContent=t,Fs(i.childNodes)}function Fs(t){return t.length>1?t:t[0]}function It(t,e){if(ee(t))for(e(t),t=t.firstElementChild;t;){const i=t.nextElementSibling;It(t,e),t=i;}}function w(t,e){return Hs(t)?H(zt(t)):Ui(t,e)}function z(t,e){return Hs(t)?k(zt(t)):Te(t,e)}function Hs(t){return D(t)&&ot(t.trim(),"<")}const Ft={width:["left","right"],height:["top","bottom"]};function b(t){const e=ee(t)?H(t).getBoundingClientRect():{height:et(t),width:_e(t),top:0,left:0};return {height:e.height,width:e.width,top:e.top,left:e.left,bottom:e.top+e.height,right:e.left+e.width}}function A(t,e){e&&c(t,{left:0,top:0});const i=b(t);if(t){const{scrollY:s,scrollX:n}=se(t),o={height:s,width:n};for(const r in Ft)for(const a of Ft[r])i[a]+=o[r];}if(!e)return i;for(const s of ["left","top"])c(t,s,e[s]-i[s]);}function Ki(t){let{top:e,left:i}=A(t);const{ownerDocument:{body:s,documentElement:n},offsetParent:o}=H(t);let r=o||n;for(;r&&(r===s||r===n)&&c(r,"position")==="static";)r=r.parentNode;if(ee(r)){const a=A(r);e-=a.top+$(c(r,"borderTopWidth")),i-=a.left+$(c(r,"borderLeftWidth"));}return {top:e-$(c(t,"marginTop")),left:i-$(c(t,"marginLeft"))}}function Ht(t){t=H(t);const e=[t.offsetTop,t.offsetLeft];for(;t=t.offsetParent;)if(e[0]+=t.offsetTop+$(c(t,"borderTopWidth")),e[1]+=t.offsetLeft+$(c(t,"borderLeftWidth")),c(t,"position")==="fixed"){const i=se(t);return e[0]+=i.scrollY,e[1]+=i.scrollX,e}return e}const et=Ls("height"),_e=Ls("width");function Ls(t){const e=Tt(t);return (i,s)=>{if(Y(s)){if(te(i))return i[`inner${e}`];if(Ge(i)){const n=i.documentElement;return Math.max(n[`offset${e}`],n[`scroll${e}`])}return i=H(i),s=c(i,t),s=s==="auto"?i[`offset${e}`]:$(s)||0,s-he(i,t)}else return c(i,t,!s&&s!==0?"":+s+he(i,t)+"px")}}function he(t,e,i="border-box"){return c(t,"boxSizing")===i?Dt(Ft[e].map(Tt),s=>$(c(t,`padding${s}`))+$(c(t,`border${s}Width`))):0}function ri(t){for(const e in Ft)for(const i in Ft[e])if(Ft[e][i]===t)return Ft[e][1-i];return t}function ht(t,e="width",i=window,s=!1){return D(t)?Dt(ar(t),n=>{const o=hr(n);return o?cr(o==="vh"?ur():o==="vw"?_e(se(i)):s?i[`offset${Tt(e)}`]:b(i)[e],n):n}):$(t)}const rr=/-?\d+(?:\.\d+)?(?:v[wh]|%|px)?/g,ar=dt(t=>t.toString().replace(/\s/g,"").match(rr)||[]),lr=/(?:v[hw]|%)$/,hr=dt(t=>(t.match(lr)||[])[0]);function cr(t,e){return t*$(e)/100}let Ae,ce;function ur(){return Ae||(ce||(ce=w("<div>"),c(ce,{height:"100vh",position:"fixed"}),x(window,"resize",()=>Ae=null)),L(document.body,ce),Ae=ce.clientHeight,lt(ce),Ae)}const Lt=typeof window<"u",X=Lt&&document.dir==="rtl",Wt=Lt&&"ontouchstart"in window,ue=Lt&&window.PointerEvent,mt=ue?"pointerdown":Wt?"touchstart":"mousedown",ai=ue?"pointermove":Wt?"touchmove":"mousemove",_t=ue?"pointerup":Wt?"touchend":"mouseup",Rt=ue?"pointerenter":Wt?"":"mouseenter",Oe=ue?"pointerleave":Wt?"":"mouseleave",li=ue?"pointercancel":"touchcancel",J={reads:[],writes:[],read(t){return this.reads.push(t),Qi(),t},write(t){return this.writes.push(t),Qi(),t},clear(t){Rs(this.reads,t),Rs(this.writes,t);},flush:Zi};function Zi(t){Ws(J.reads),Ws(J.writes.splice(0)),J.scheduled=!1,(J.reads.length||J.writes.length)&&Qi(t+1);}const fr=4;function Qi(t){J.scheduled||(J.scheduled=!0,t&&t<fr?Promise.resolve().then(()=>Zi(t)):requestAnimationFrame(()=>Zi(1)));}function Ws(t){let e;for(;e=t.shift();)try{e();}catch(i){console.error(i);}}function Rs(t,e){const i=t.indexOf(e);return ~i&&t.splice(i,1)}function ts(){}ts.prototype={positions:[],init(){this.positions=[];let t;this.unbind=x(document,"mousemove",e=>t=le(e)),this.interval=setInterval(()=>{t&&(this.positions.push(t),this.positions.length>5&&this.positions.shift());},50);},cancel(){var t;(t=this.unbind)==null||t.call(this),clearInterval(this.interval);},movesTo(t){if(this.positions.length<2)return !1;const e=t.getBoundingClientRect(),{left:i,right:s,top:n,bottom:o}=e,[r]=this.positions,a=ne(this.positions),l=[r,a];return Ze(a,e)?!1:[[{x:i,y:n},{x:s,y:o}],[{x:i,y:o},{x:s,y:n}]].some(u=>{const f=dr(l,u);return f&&Ze(f,e)})}};function dr([{x:t,y:e},{x:i,y:s}],[{x:n,y:o},{x:r,y:a}]){const l=(a-o)*(i-t)-(r-n)*(s-e);if(l===0)return !1;const h=((r-n)*(e-o)-(a-o)*(t-n))/l;return h<0?!1:{x:t+h*(i-t),y:e+h*(s-e)}}function js(t,e,i={},{intersecting:s=!0}={}){const n=new IntersectionObserver(s?(o,r)=>{o.some(a=>a.isIntersecting)&&e(o,r);}:e,i);for(const o of k(t))n.observe(o);return n}const pr=Lt&&window.ResizeObserver;function hi(t,e,i={box:"border-box"}){if(pr)return Us(ResizeObserver,t,e,i);const s=[x(window,"load resize",e),x(document,"loadedmetadata load",e,!0)];return {disconnect:()=>s.map(n=>n())}}function es(t){return {disconnect:x([window,window.visualViewport],"resize",t)}}function qs(t,e,i){return Us(MutationObserver,t,e,i)}function Us(t,e,i,s){const n=new t(i);for(const o of k(e))n.observe(o,s);return n}function Vs(t){if(ui(t)&&is(t,{func:"playVideo",method:"play"}),ci(t))try{t.play().catch(S);}catch{}}function Ys(t){ui(t)&&is(t,{func:"pauseVideo",method:"pause"}),ci(t)&&t.pause();}function Gs(t){ui(t)&&is(t,{func:"mute",method:"setVolume",value:0}),ci(t)&&(t.muted=!0);}function Xs(t){return ci(t)||ui(t)}function ci(t){return G(t,"video")}function ui(t){return G(t,"iframe")&&(Js(t)||Ks(t))}function Js(t){return !!t.src.match(/\/\/.*?youtube(-nocookie)?\.[a-z]+\/(watch\?v=[^&\s]+|embed)|youtu\.be\/.*/)}function Ks(t){return !!t.src.match(/vimeo\.com\/video\/.*/)}async function is(t,e){await mr(t),Zs(t,e);}function Zs(t,e){try{t.contentWindow.postMessage(JSON.stringify({event:"command",...e}),"*");}catch{}}const ss="_ukPlayer";let gr=0;function mr(t){if(t[ss])return t[ss];const e=Js(t),i=Ks(t),s=++gr;let n;return t[ss]=new Promise(o=>{e&&j(t,"load",()=>{const r=()=>Zs(t,{event:"listening",id:s});n=setInterval(r,100),r();}),j(window,"message",o,!1,({data:r})=>{try{return r=JSON.parse(r),e&&(r==null?void 0:r.id)===s&&r.event==="onReady"||i&&Number(r==null?void 0:r.player_id)===s}catch{}}),t.src=`${t.src}${m(t.src,"?")?"&":"?"}${e?"enablejsapi=1":`api=1&player_id=${s}`}`;}).then(()=>clearInterval(n))}function ns(t,e=0,i=0){return R(t)?zi(...jt(t).map(s=>{const{top:n,left:o,bottom:r,right:a}=ct(s);return {top:n-e,left:o-i,bottom:r+e,right:a+i}}).concat(A(t))):!1}function Qs(t,{offset:e=0}={}){const i=R(t)?fe(t,!1,["hidden"]):[];return i.reduce((r,a,l)=>{const{scrollTop:h,scrollHeight:u,offsetHeight:f}=a,d=ct(a),g=u-d.height,{height:O,top:N}=i[l-1]?ct(i[l-1]):A(t);let F=Math.ceil(N-d.top-e+h);return e>0&&f<O+e?F+=e:e=0,F>g?(e-=F-g,F=g):F<0&&(e-=F,F=0),()=>s(a,F-h).then(r)},()=>Promise.resolve())();function s(r,a){return new Promise(l=>{const h=r.scrollTop,u=n(Math.abs(a)),f=Date.now();(function d(){const g=o(Z((Date.now()-f)/u));r.scrollTop=h+a*g,g===1?l():requestAnimationFrame(d);})();})}function n(r){return 40*Math.pow(r,.375)}function o(r){return .5*(1-Math.cos(Math.PI*r))}}function os(t,e=0,i=0){if(!R(t))return 0;const s=Ct(t,!0),{scrollHeight:n,scrollTop:o}=s,{height:r}=ct(s),a=n-r,l=Ht(t)[0]-Ht(s)[0],h=Math.max(0,l-r+e),u=Math.min(a,l+t.offsetHeight-i);return Z((o-h)/(u-h))}function fe(t,e=!1,i=[]){const s=tn(t);let n=oe(t).reverse();n=n.slice(n.indexOf(s)+1);const o=xt(n,r=>c(r,"position")==="fixed");return ~o&&(n=n.slice(o)),[s].concat(n.filter(r=>c(r,"overflow").split(" ").some(a=>m(["auto","scroll",...i],a))&&(!e||r.scrollHeight>ct(r).height))).reverse()}function Ct(...t){return fe(...t)[0]}function jt(t){return fe(t,!1,["hidden","clip"])}function ct(t){const e=se(t),{visualViewport:i,document:{documentElement:s}}=e;let n=t===tn(t)?e:t;if(te(n)&&i){let{height:r,width:a,scale:l,pageTop:h,pageLeft:u}=i;return r=Math.round(r*l),a=Math.round(a*l),{height:r,width:a,top:h,left:u,bottom:h+r,right:u+a}}let o=A(n);if(c(n,"display")==="inline")return o;for(let[r,a,l,h]of [["width","x","left","right"],["height","y","top","bottom"]]){te(n)?n=s:o[l]+=$(c(n,`border-${l}-width`));const u=o[r]%1;o[r]=o[a]=n[`client${Tt(r)}`]-(u?u<.5?-u:1-u:0),o[h]=o[r]+o[l];}return o}function tn(t){return se(t).document.scrollingElement}const ut=[["width","x","left","right"],["height","y","top","bottom"]];function en(t,e,i){i={attach:{element:["left","top"],target:["left","top"],...i.attach},offset:[0,0],placement:[],...i},Q(e)||(e=[e,e]),A(t,sn(t,e,i));}function sn(t,e,i){const s=nn(t,e,i),{boundary:n,viewportOffset:o=0,placement:r}=i;let a=s;for(const[l,[h,,u,f]]of Object.entries(ut)){const d=vr(t,e[l],o,n,l);if(fi(s,d,l))continue;let g=0;if(r[l]==="flip"){const O=i.attach.target[l];if(O===f&&s[f]<=d[f]||O===u&&s[u]>=d[u])continue;g=br(t,e,i,l)[u]-s[u];const N=wr(t,e[l],o,l);if(!fi(rs(s,g,l),N,l)){if(fi(s,N,l))continue;if(i.recursion)return !1;const F=$r(t,e,i);if(F&&fi(F,N,1-l))return F;continue}}else if(r[l]==="shift"){const O=A(e[l]),{offset:N}=i;g=Z(Z(s[u],d[u],d[f]-s[h]),O[u]-s[h]+N[l],O[f]-N[l])-s[u];}a=rs(a,g,l);}return a}function nn(t,e,i){let{attach:s,offset:n}={attach:{element:["left","top"],target:["left","top"],...i.attach},offset:[0,0],...i},o=A(t);for(const[r,[a,,l,h]]of Object.entries(ut)){const u=s.target[r]===s.element[r]?ct(e[r]):A(e[r]);o=rs(o,u[l]-o[l]+on(s.target[r],h,u[a])-on(s.element[r],h,o[a])+ +n[r],r);}return o}function rs(t,e,i){const[,s,n,o]=ut[i],r={...t};return r[n]=t[s]=t[n]+e,r[o]+=e,r}function on(t,e,i){return t==="center"?i/2:t===e?i:0}function vr(t,e,i,s,n){let o=an(...rn(t,e).map(ct));return i&&(o[ut[n][2]]+=i,o[ut[n][3]]-=i),s&&(o=an(o,A(Q(s)?s[n]:s))),o}function wr(t,e,i,s){const[n,o,r,a]=ut[s],[l]=rn(t,e),h=ct(l);return ["auto","scroll"].includes(c(l,`overflow-${o}`))&&(h[r]-=l[`scroll${Tt(r)}`],h[a]=h[r]+l[`scroll${Tt(n)}`]),h[r]+=i,h[a]-=i,h}function rn(t,e){return jt(e).filter(i=>B(t,i))}function an(...t){let e={};for(const i of t)for(const[,,s,n]of ut)e[s]=Math.max(e[s]||0,i[s]),e[n]=Math.min(...[e[n],i[n]].filter(Boolean));return e}function fi(t,e,i){const[,,s,n]=ut[i];return t[s]>=e[s]&&t[n]<=e[n]}function br(t,e,{offset:i,attach:s},n){return nn(t,e,{attach:{element:ln(s.element,n),target:ln(s.target,n)},offset:xr(i,n)})}function $r(t,e,i){return sn(t,e,{...i,attach:{element:i.attach.element.map(hn).reverse(),target:i.attach.target.map(hn).reverse()},offset:i.offset.reverse(),placement:i.placement.reverse(),recursion:!0})}function ln(t,e){const i=[...t],s=ut[e].indexOf(t[e]);return ~s&&(i[e]=ut[e][1-s%2+2]),i}function hn(t){for(let e=0;e<ut.length;e++){const i=ut[e].indexOf(t);if(~i)return ut[1-e][i%2+2]}}function xr(t,e){return t=[...t],t[e]*=-1,t}var yr=Object.freeze({__proto__:null,$:w,$$:z,Animation:gt,Dimensions:Qe,MouseTracker:ts,Transition:E,addClass:y,after:si,append:L,apply:It,assign:wt,attr:p,before:ii,boxModelAdjust:he,camelize:be,children:T,clamp:Z,closest:U,createEvent:Mt,css:c,data:tt,dimensions:b,each:Pt,empty:Xi,endsWith:Zt,escape:Vi,fastdom:J,filter:Ie,find:Ui,findAll:Te,findIndex:xt,flipPosition:ri,fragment:zt,getEventPos:le,getIndex:rt,getTargetedElement:qi,hasAttr:$t,hasClass:P,hasOwn:vt,hasTouch:Wt,height:et,html:Nt,hyphenate:Kt,inBrowser:Lt,includes:m,index:re,intersectRect:zi,isArray:Q,isBoolean:ie,isDocument:Ge,isElement:ee,isEmpty:xe,isEqual:Je,isFocusable:ti,isFunction:it,isInView:ns,isInput:ji,isNode:Xe,isNumber:$e,isNumeric:bt,isObject:Et,isPlainObject:yt,isRtl:X,isSameSiteAnchor:ae,isString:D,isTag:G,isTouch:St,isUndefined:Y,isVideo:Xs,isVisible:R,isVoidElement:Ri,isWindow:te,last:ne,matches:C,memoize:dt,mute:Gs,noop:S,observeIntersection:js,observeMutation:qs,observeResize:hi,observeViewportResize:es,off:Bt,offset:A,offsetPosition:Ht,offsetViewport:ct,on:x,once:j,overflowParents:jt,parent:_,parents:oe,pause:Ys,pick:Ni,play:Vs,pointInRect:Ze,pointerCancel:li,pointerDown:mt,pointerEnter:Rt,pointerLeave:Oe,pointerMove:ai,pointerUp:_t,position:Ki,positionAt:en,prepend:sr,propName:ei,query:at,queryAll:Ce,ready:ir,remove:lt,removeAttr:ye,removeClass:M,removeClasses:Hi,replaceClass:Li,scrollIntoView:Qs,scrollParent:Ct,scrollParents:fe,scrolledOver:os,selFocusable:Se,selInput:ke,sortBy:Ke,startsWith:ot,sumBy:Dt,swap:Mi,toArray:Qt,toBoolean:Bi,toEventTargets:Gi,toFloat:$,toNode:H,toNodes:k,toNumber:kt,toPx:ht,toWindow:se,toggleClass:q,trigger:v,ucfirst:Tt,uniqueBy:_s,unwrap:Pe,width:_e,within:B,wrapAll:oi,wrapInner:Ji}),st={connected(){y(this.$el,this.$options.id);}};const kr=["days","hours","minutes","seconds"];var Sr={mixins:[st],props:{date:String,clsWrapper:String,role:String},data:{date:"",clsWrapper:".uk-countdown-%unit%",role:"timer"},connected(){p(this.$el,"role",this.role),this.date=$(Date.parse(this.$props.date)),this.end=!1,this.start();},disconnected(){this.stop();},events:{name:"visibilitychange",el(){return document},handler(){document.hidden?this.stop():this.start();}},methods:{start(){this.stop(),this.update(),this.timer||(v(this.$el,"countdownstart"),this.timer=setInterval(this.update,1e3));},stop(){this.timer&&(clearInterval(this.timer),v(this.$el,"countdownstop"),this.timer=null);},update(){const t=Ir(this.date);t.total||(this.stop(),this.end||(v(this.$el,"countdownend"),this.end=!0));for(const e of kr){const i=w(this.clsWrapper.replace("%unit%",e),this.$el);if(!i)continue;let s=String(Math.trunc(t[e]));s=s.length<2?`0${s}`:s,i.textContent!==s&&(s=s.split(""),s.length!==i.children.length&&Nt(i,s.map(()=>"<span></span>").join("")),s.forEach((n,o)=>i.children[o].textContent=n));}}}};function Ir(t){const e=Math.max(0,t-Date.now())/1e3;return {total:e,seconds:e%60,minutes:e/60%60,hours:e/60/60%24,days:e/60/60/24}}const V={};V.events=V.watch=V.observe=V.created=V.beforeConnect=V.connected=V.beforeDisconnect=V.disconnected=V.destroy=as,V.args=function(t,e){return e!==!1&&as(e||t)},V.update=function(t,e){return Ke(as(t,it(e)?{read:e}:e),"order")},V.props=function(t,e){if(Q(e)){const i={};for(const s of e)i[s]=String;e=i;}return V.methods(t,e)},V.computed=V.methods=function(t,e){return e?t?{...t,...e}:e:t},V.i18n=V.data=function(t,e,i){return i?cn(t,e,i):e?t?function(s){return cn(t,e,s)}:e:t};function cn(t,e,i){return V.computed(it(t)?t.call(i,i):t,it(e)?e.call(i,i):e)}function as(t,e){return t=t&&!Q(t)?[t]:t,e?t?t.concat(e):Q(e)?e:[e]:t}function Cr(t,e){return Y(e)?t:e}function De(t,e,i){const s={};if(it(e)&&(e=e.options),e.extends&&(t=De(t,e.extends,i)),e.mixins)for(const o of e.mixins)t=De(t,o,i);for(const o in t)n(o);for(const o in e)vt(t,o)||n(o);function n(o){s[o]=(V[o]||Cr)(t[o],e[o],i);}return s}function Be(t,e=[]){try{return t?ot(t,"{")?JSON.parse(t):e.length&&!m(t,":")?{[e[0]]:t}:t.split(";").reduce((i,s)=>{const[n,o]=s.split(/:(.*)/);return n&&!Y(o)&&(i[n.trim()]=o.trim()),i},{}):{}}catch{return {}}}function ls(t,e){return t===Boolean?Bi(e):t===Number?kt(e):t==="list"?Tr(e):t===Object&&D(e)?Be(e):t?t(e):e}function Tr(t){return Q(t)?t:D(t)?t.split(/,(?![^(]*\))/).map(e=>bt(e)?kt(e):Bi(e.trim())):[t]}function pt(t){return ze(hi,t,"resize")}function Me(t){return ze(js,t)}function un(t){return ze(qs,t)}function Ne(t={}){return Me({handler:function(e,i){const{targets:s=this.$el,preload:n=5}=t;for(const o of k(it(s)?s(this):s))z('[loading="lazy"]',o).slice(0,n-1).forEach(r=>ye(r,"loading"));for(const o of e.filter(({isIntersecting:r})=>r).map(({target:r})=>r))i.unobserve(o);},...t})}function fn(){return ze((t,e)=>es(e))}function di(t){return ze((e,i)=>({disconnect:x(Pr(e),"scroll",i,{passive:!0,capture:!0})}),t,"scroll")}function dn(t){return {observe(e,i){return {observe:S,unobserve:S,disconnect:x(e,mt,i,{passive:!0})}},handler(e){if(!St(e))return;const i=le(e),s="tagName"in e.target?e.target:_(e.target);j(document,`${_t} ${li} scroll`,n=>{const{x:o,y:r}=le(n);(n.type!=="scroll"&&s&&o&&Math.abs(i.x-o)>100||r&&Math.abs(i.y-r)>100)&&setTimeout(()=>{v(s,"swipe"),v(s,`swipe${Er(i.x,i.y,o,r)}`);});});},...t}}function ze(t,e,i){return {observe:t,handler(){this.$emit(i);},...e}}function Er(t,e,i,s){return Math.abs(t-i)>=Math.abs(e-s)?t-i>0?"Left":"Right":e-s>0?"Up":"Down"}function Pr(t){return k(t).map(e=>{const{ownerDocument:i}=e,s=Ct(e,!0);return s===i.scrollingElement?i:s})}var pn={props:{margin:String,firstColumn:Boolean},data:{margin:"uk-margin-small-top",firstColumn:"uk-first-column"},observe:[un({options:{childList:!0,attributes:!0,attributeFilter:["style"]}}),pt({target:({$el:t})=>[t,...T(t)]})],update:{read(){const t=hs(this.$el.children);return {rows:t,columns:_r(t)}},write({columns:t,rows:e}){for(const i of e)for(const s of i)q(s,this.margin,e[0]!==i),q(s,this.firstColumn,t[0].includes(s));},events:["resize"]}};function hs(t){return gn(t,"top","bottom")}function _r(t){const e=[];for(const i of t){const s=gn(i,"left","right");for(let n=0;n<s.length;n++)e[n]=e[n]?e[n].concat(s[n]):s[n];}return X?e.reverse():e}function gn(t,e,i){const s=[[]];for(const n of t){if(!R(n))continue;let o=pi(n);for(let r=s.length-1;r>=0;r--){const a=s[r];if(!a[0]){a.push(n);break}let l;if(a[0].offsetParent===n.offsetParent?l=pi(a[0]):(o=pi(n,!0),l=pi(a[0],!0)),o[e]>=l[i]-1&&o[e]!==l[e]){s.push([n]);break}if(o[i]-1>l[e]||o[e]===l[e]){a.push(n);break}if(r===0){s.unshift([n]);break}}}return s}function pi(t,e=!1){let{offsetTop:i,offsetLeft:s,offsetHeight:n,offsetWidth:o}=t;return e&&([i,s]=Ht(t)),{top:i,left:s,bottom:i+n,right:s+o}}const cs="uk-transition-leave",us="uk-transition-enter";function mn(t,e,i,s=0){const n=gi(e,!0),o={opacity:1},r={opacity:0},a=u=>()=>n===gi(e)?u():Promise.reject(),l=a(async()=>{y(e,cs),await Promise.all(wn(e).map((u,f)=>new Promise(d=>setTimeout(()=>E.start(u,r,i/2,"ease").then(d),f*s)))),M(e,cs);}),h=a(async()=>{const u=et(e);y(e,us),t(),c(T(e),{opacity:0}),await Ar();const f=T(e),d=et(e);c(e,"alignContent","flex-start"),et(e,u);const g=wn(e);c(f,r);const O=g.map(async(N,F)=>{await Or(F*s),await E.start(N,o,i/2,"ease");});u!==d&&O.push(E.start(e,{height:d},i/2+g.length*s,"ease")),await Promise.all(O).then(()=>{M(e,us),n===gi(e)&&(c(e,{height:"",alignContent:""}),c(f,{opacity:""}),delete e.dataset.transition);});});return P(e,cs)?vn(e).then(h):P(e,us)?vn(e).then(l).then(h):l().then(h)}function gi(t,e){return e&&(t.dataset.transition=1+gi(t)),kt(t.dataset.transition)||0}function vn(t){return Promise.all(T(t).filter(E.inProgress).map(e=>new Promise(i=>j(e,"transitionend transitioncanceled",i))))}function wn(t){return hs(T(t)).reduce((e,i)=>e.concat(Ke(i.filter(s=>ns(s)),"offsetLeft")),[])}function Ar(){return new Promise(t=>requestAnimationFrame(t))}function Or(t){return new Promise(e=>setTimeout(e,t))}async function Dr(t,e,i){await xn();let s=T(e);const n=s.map(d=>bn(d,!0)),o={...c(e,["height","padding"]),display:"block"};await Promise.all(s.concat(e).map(E.cancel)),t(),s=s.concat(T(e).filter(d=>!m(s,d))),await Promise.resolve(),J.flush();const r=p(e,"style"),a=c(e,["height","padding"]),[l,h]=Br(e,s,n),u=s.map(d=>({style:p(d,"style")}));s.forEach((d,g)=>h[g]&&c(d,h[g])),c(e,o),v(e,"scroll"),J.flush(),await xn();const f=s.map((d,g)=>_(d)===e&&E.start(d,l[g],i,"ease")).concat(E.start(e,a,i,"ease"));try{await Promise.all(f),s.forEach((d,g)=>{p(d,u[g]),_(d)===e&&c(d,"display",l[g].opacity===0?"none":"");}),p(e,"style",r);}catch{p(s,"style",""),Mr(e,o);}}function bn(t,e){const i=c(t,"zIndex");return R(t)?{display:"",opacity:e?c(t,"opacity"):"0",pointerEvents:"none",position:"absolute",zIndex:i==="auto"?re(t):i,...$n(t)}:!1}function Br(t,e,i){const s=e.map((o,r)=>_(o)&&r in i?i[r]?R(o)?$n(o):{opacity:0}:{opacity:R(o)?1:0}:!1),n=s.map((o,r)=>{const a=_(e[r])===t&&(i[r]||bn(e[r]));if(!a)return !1;if(!o)delete a.opacity;else if(!("opacity"in o)){const{opacity:l}=a;l%1?o.opacity=1:delete a.opacity;}return a});return [s,n]}function Mr(t,e){for(const i in e)c(t,i,"");}function $n(t){const{height:e,width:i}=A(t);return {height:e,width:i,transform:"",...Ki(t),...c(t,["marginTop","marginLeft"])}}function xn(){return new Promise(t=>requestAnimationFrame(t))}var yn={props:{duration:Number,animation:Boolean},data:{duration:150,animation:"slide"},methods:{animate(t,e=this.$el){const i=this.animation;return (i==="fade"?mn:i==="delayed-fade"?(...n)=>mn(...n,40):i?Dr:()=>(t(),Promise.resolve()))(t,e,this.duration).catch(S)}}};const I={TAB:9,ESC:27,SPACE:32,END:35,HOME:36,LEFT:37,UP:38,RIGHT:39,DOWN:40};var Nr={mixins:[yn],args:"target",props:{target:String,selActive:Boolean},data:{target:"",selActive:!1,attrItem:"uk-filter-control",cls:"uk-active",duration:250},computed:{toggles({attrItem:t},e){return z(`[${t}],[data-${t}]`,e)},children({target:t},e){return z(`${t} > *`,e)}},watch:{toggles(t){this.updateState();const e=z(this.selActive,this.$el);for(const i of t){this.selActive!==!1&&q(i,this.cls,m(e,i));const s=Rr(i);G(s,"a")&&p(s,"role","button");}},children(t,e){e&&this.updateState();}},events:{name:"click keydown",delegate(){return `[${this.attrItem}],[data-${this.attrItem}]`},handler(t){t.type==="keydown"&&t.keyCode!==I.SPACE||U(t.target,"a,button")&&(t.preventDefault(),this.apply(t.current));}},methods:{apply(t){const e=this.getState(),i=Sn(t,this.attrItem,this.getState());zr(e,i)||this.setState(i);},getState(){return this.toggles.filter(t=>P(t,this.cls)).reduce((t,e)=>Sn(e,this.attrItem,t),{filter:{"":""},sort:[]})},async setState(t,e=!0){t={filter:{"":""},sort:[],...t},v(this.$el,"beforeFilter",[this,t]);for(const i of this.toggles)q(i,this.cls,Hr(i,this.attrItem,t));await Promise.all(z(this.target,this.$el).map(i=>{const s=()=>{Fr(t,i,T(i)),this.$update(this.$el);};return e?this.animate(s,i):s()})),v(this.$el,"afterFilter",[this]);},updateState(){J.write(()=>this.setState(this.getState(),!1));}}};function kn(t,e){return Be(tt(t,e),["filter"])}function zr(t,e){return ["filter","sort"].every(i=>Je(t[i],e[i]))}function Fr(t,e,i){const s=Lr(t);i.forEach(r=>c(r,"display",s&&!C(r,s)?"none":""));const[n,o]=t.sort;if(n){const r=Wr(i,n,o);Je(r,i)||L(e,r);}}function Sn(t,e,i){const{filter:s,group:n,sort:o,order:r="asc"}=kn(t,e);return (s||Y(o))&&(n?s?(delete i.filter[""],i.filter[n]=s):(delete i.filter[n],(xe(i.filter)||""in i.filter)&&(i.filter={"":s||""})):i.filter={"":s||""}),Y(o)||(i.sort=[o,r]),i}function Hr(t,e,{filter:i={"":""},sort:[s,n]}){const{filter:o="",group:r="",sort:a,order:l="asc"}=kn(t,e);return Y(a)?r in i&&o===i[r]||!o&&r&&!(r in i)&&!i[""]:s===a&&n===l}function Lr({filter:t}){let e="";return Pt(t,i=>e+=i||""),e}function Wr(t,e,i){return [...t].sort((s,n)=>tt(s,e).localeCompare(tt(n,e),void 0,{numeric:!0})*(i==="asc"||-1))}function Rr(t){return w("a,button",t)||t}var Fe={props:{container:Boolean},data:{container:!0},computed:{container({container:t}){return t===!0&&this.$container||t&&w(t)}}};let fs;function In(t){const e=x(t,"touchmove",s=>{if(s.targetTouches.length!==1||C(s.target,'input[type="range"'))return;let{scrollHeight:n,clientHeight:o}=Ct(s.target);o>=n&&s.cancelable&&s.preventDefault();},{passive:!1});if(fs)return e;fs=!0;const{scrollingElement:i}=document;return c(i,{overflowY:CSS.supports("overflow","clip")?"clip":"hidden",touchAction:"none",paddingRight:_e(window)-i.clientWidth||""}),()=>{fs=!1,e(),c(i,{overflowY:"",touchAction:"",paddingRight:""});}}var qt={props:{cls:Boolean,animation:"list",duration:Number,velocity:Number,origin:String,transition:String},data:{cls:!1,animation:[!1],duration:200,velocity:.2,origin:!1,transition:"ease",clsEnter:"uk-togglabe-enter",clsLeave:"uk-togglabe-leave"},computed:{hasAnimation({animation:t}){return !!t[0]},hasTransition({animation:t}){return ["slide","reveal"].some(e=>ot(t[0],e))}},methods:{async toggleElement(t,e,i){try{return await Promise.all(k(t).map(s=>{const n=ie(e)?e:!this.isToggled(s);if(!v(s,`before${n?"show":"hide"}`,[this]))return Promise.reject();const o=(it(i)?i:i===!1||!this.hasAnimation?jr:this.hasTransition?qr:Ur)(s,n,this),r=n?this.clsEnter:this.clsLeave;y(s,r),v(s,n?"show":"hide",[this]);const a=()=>{M(s,r),v(s,n?"shown":"hidden",[this]);};return o?o.then(a,()=>(M(s,r),Promise.reject())):a()})),!0}catch{return !1}},isToggled(t=this.$el){return t=H(t),P(t,this.clsEnter)?!0:P(t,this.clsLeave)?!1:this.cls?P(t,this.cls.split(" ")[0]):R(t)},_toggle(t,e){if(!t)return;e=!!e;let i;this.cls?(i=m(this.cls," ")||e!==P(t,this.cls),i&&q(t,this.cls,m(this.cls," ")?void 0:e)):(i=e===t.hidden,i&&(t.hidden=!e)),z("[autofocus]",t).some(s=>R(s)?s.focus()||!0:s.blur()),i&&v(t,"toggled",[e,this]);}}};function jr(t,e,{_toggle:i}){return gt.cancel(t),E.cancel(t),i(t,e)}async function qr(t,e,{animation:i,duration:s,velocity:n,transition:o,_toggle:r}){var a;const[l="reveal",h="top"]=((a=i[0])==null?void 0:a.split("-"))||[],u=[["left","right"],["top","bottom"]],f=u[m(u[0],h)?0:1],d=f[1]===h,O=["width","height"][u.indexOf(f)],N=`margin-${f[0]}`,F=`margin-${h}`;let Ot=b(t)[O];const Es=E.inProgress(t);await E.cancel(t),e&&r(t,!0);const Gh=Object.fromEntries(["padding","border","width","height","minWidth","minHeight","overflowY","overflowX",N,F].map(zo=>[zo,t.style[zo]])),Ye=b(t),Ps=$(c(t,N)),Bo=$(c(t,F)),Jt=Ye[O]+Bo;!Es&&!e&&(Ot+=Bo);const[Oi]=Ji(t,"<div>");c(Oi,{boxSizing:"border-box",height:Ye.height,width:Ye.width,...c(t,["overflow","padding","borderTop","borderRight","borderBottom","borderLeft","borderImage",F])}),c(t,{padding:0,border:0,minWidth:0,minHeight:0,[F]:0,width:Ye.width,height:Ye.height,overflow:"hidden",[O]:Ot});const Mo=Ot/Jt;s=(n*Jt+s)*(e?1-Mo:Mo);const No={[O]:e?Jt:0};d&&(c(t,N,Jt-Ot+Ps),No[N]=e?Ps:Jt+Ps),!d^l==="reveal"&&(c(Oi,N,-Jt+Ot),E.start(Oi,{[N]:e?0:-Jt},s,o));try{await E.start(t,No,s,o);}finally{c(t,Gh),Pe(Oi.firstChild),e||r(t,!1);}}function Ur(t,e,i){gt.cancel(t);const{animation:s,duration:n,_toggle:o}=i;return e?(o(t,!0),gt.in(t,s[0],n,i.origin)):gt.out(t,s[1]||s[0],n,i.origin).then(()=>o(t,!1))}const nt=[];var ds={mixins:[st,Fe,qt],props:{selPanel:String,selClose:String,escClose:Boolean,bgClose:Boolean,stack:Boolean,role:String},data:{cls:"uk-open",escClose:!0,bgClose:!0,overlay:!0,stack:!1,role:"dialog"},computed:{panel({selPanel:t},e){return w(t,e)},transitionElement(){return this.panel},bgClose({bgClose:t}){return t&&this.panel}},connected(){p(this.panel||this.$el,"role",this.role),this.overlay&&p(this.panel||this.$el,"aria-modal",!0);},beforeDisconnect(){m(nt,this)&&this.toggleElement(this.$el,!1,!1);},events:[{name:"click",delegate(){return `${this.selClose},a[href*="#"]`},handler(t){const{current:e,defaultPrevented:i}=t,{hash:s}=e;!i&&s&&ae(e)&&!B(s,this.$el)&&w(s,document.body)?this.hide():C(e,this.selClose)&&(t.preventDefault(),this.hide());}},{name:"toggle",self:!0,handler(t){t.defaultPrevented||(t.preventDefault(),this.isToggled()===m(nt,this)&&this.toggle());}},{name:"beforeshow",self:!0,handler(t){if(m(nt,this))return !1;!this.stack&&nt.length?(Promise.all(nt.map(e=>e.hide())).then(this.show),t.preventDefault()):nt.push(this);}},{name:"show",self:!0,handler(){this.stack&&c(this.$el,"zIndex",$(c(this.$el,"zIndex"))+nt.length);const t=[this.overlay&&Yr(this),this.overlay&&In(this.$el),this.bgClose&&Gr(this),this.escClose&&Xr(this)];j(this.$el,"hidden",()=>t.forEach(e=>e&&e()),{self:!0}),y(document.documentElement,this.clsPage);}},{name:"shown",self:!0,handler(){ti(this.$el)||p(this.$el,"tabindex","-1"),C(this.$el,":focus-within")||this.$el.focus();}},{name:"hidden",self:!0,handler(){m(nt,this)&&nt.splice(nt.indexOf(this),1),c(this.$el,"zIndex",""),nt.some(t=>t.clsPage===this.clsPage)||M(document.documentElement,this.clsPage);}}],methods:{toggle(){return this.isToggled()?this.hide():this.show()},show(){return this.container&&_(this.$el)!==this.container?(L(this.container,this.$el),new Promise(t=>requestAnimationFrame(()=>this.show().then(t)))):this.toggleElement(this.$el,!0,Cn)},hide(){return this.toggleElement(this.$el,!1,Cn)}}};function Cn(t,e,{transitionElement:i,_toggle:s}){return new Promise((n,o)=>j(t,"show hide",()=>{var r;(r=t._reject)==null||r.call(t),t._reject=o,s(t,e);const a=j(i,"transitionstart",()=>{j(i,"transitionend transitioncancel",n,{self:!0}),clearTimeout(l);},{self:!0}),l=setTimeout(()=>{a(),n();},Vr(c(i,"transitionDuration")));})).then(()=>delete t._reject)}function Vr(t){return t?Zt(t,"ms")?$(t):$(t)*1e3:0}function Yr(t){return x(document,"focusin",e=>{ne(nt)===t&&!B(e.target,t.$el)&&t.$el.focus();})}function Gr(t){return x(document,mt,({target:e})=>{ne(nt)!==t||t.overlay&&!B(e,t.$el)||B(e,t.panel)||j(document,`${_t} ${li} scroll`,({defaultPrevented:i,type:s,target:n})=>{!i&&s===_t&&e===n&&t.hide();},!0);})}function Xr(t){return x(document,"keydown",e=>{e.keyCode===27&&ne(nt)===t&&t.hide();})}var ps={slide:{show(t){return [{transform:W(t*-100)},{transform:W()}]},percent(t){return He(t)},translate(t,e){return [{transform:W(e*-100*t)},{transform:W(e*100*(1-t))}]}}};function He(t){return Math.abs(c(t,"transform").split(",")[4]/t.offsetWidth)||0}function W(t=0,e="%"){return t+=t?e:"",`translate3d(${t}, 0, 0)`}function de(t){return `scale3d(${t}, ${t}, 1)`}function Jr(t,e,i,{animation:s,easing:n}){const{percent:o,translate:r,show:a=S}=s,l=a(i);let h;return {dir:i,show(u,f=0,d){const g=d?"linear":n;return u-=Math.round(u*Z(f,-1,1)),this.translate(f),mi(e,"itemin",{percent:f,duration:u,timing:g,dir:i}),mi(t,"itemout",{percent:1-f,duration:u,timing:g,dir:i}),new Promise(O=>{h||(h=O),Promise.all([E.start(e,l[1],u,g),E.start(t,l[0],u,g)]).then(()=>{this.reset(),h();},S);})},cancel(){return E.cancel([e,t])},reset(){for(const u in l[0])c([e,t],u,"");},async forward(u,f=this.percent()){return await this.cancel(),this.show(u,f,!0)},translate(u){this.reset();const f=r(u,i);c(e,f[1]),c(t,f[0]),mi(e,"itemtranslatein",{percent:u,dir:i}),mi(t,"itemtranslateout",{percent:1-u,dir:i});},percent(){return o(t||e,e,i)},getDistance(){return t==null?void 0:t.offsetWidth}}}function mi(t,e,i){v(t,Mt(e,!1,!1,i));}var vi={props:{i18n:Object},data:{i18n:null},methods:{t(t,...e){var i,s,n;let o=0;return ((n=((i=this.i18n)==null?void 0:i[t])||((s=this.$options.i18n)==null?void 0:s[t]))==null?void 0:n.replace(/%s/g,()=>e[o++]||""))||""}}},Kr={props:{autoplay:Boolean,autoplayInterval:Number,pauseOnHover:Boolean},data:{autoplay:!1,autoplayInterval:7e3,pauseOnHover:!0},connected(){p(this.list,"aria-live",this.autoplay?"off":"polite"),this.autoplay&&this.startAutoplay();},disconnected(){this.stopAutoplay();},update(){p(this.slides,"tabindex","-1");},events:[{name:"visibilitychange",el(){return document},filter(){return this.autoplay},handler(){document.hidden?this.stopAutoplay():this.startAutoplay();}}],methods:{startAutoplay(){this.stopAutoplay(),this.interval=setInterval(()=>{this.stack.length||this.draggable&&C(this.$el,":focus-within")||this.pauseOnHover&&C(this.$el,":hover")||this.show("next");},this.autoplayInterval);},stopAutoplay(){clearInterval(this.interval);}}};const gs={passive:!1,capture:!0},Tn={passive:!0,capture:!0},Zr="touchstart mousedown",ms="touchmove mousemove",En="touchend touchcancel mouseup click input scroll";var Qr={props:{draggable:Boolean},data:{draggable:!0,threshold:10},created(){for(const t of ["start","move","end"]){const e=this[t];this[t]=i=>{const s=le(i).x*(X?-1:1);this.prevPos=s===this.pos?this.prevPos:this.pos,this.pos=s,e(i);};}},events:[{name:Zr,passive:!0,delegate(){return `${this.selList} > *`},handler(t){!this.draggable||!St(t)&&ta(t.target)||U(t.target,ke)||t.button>0||this.length<2||this.start(t);}},{name:"dragstart",handler(t){t.preventDefault();}},{name:ms,el(){return this.list},handler:S,...gs}],methods:{start(){this.drag=this.pos,this._transitioner?(this.percent=this._transitioner.percent(),this.drag+=this._transitioner.getDistance()*this.percent*this.dir,this._transitioner.cancel(),this._transitioner.translate(this.percent),this.dragging=!0,this.stack=[]):this.prevIndex=this.index,x(document,ms,this.move,gs),x(document,En,this.end,Tn),c(this.list,"userSelect","none");},move(t){const e=this.pos-this.drag;if(e===0||this.prevPos===this.pos||!this.dragging&&Math.abs(e)<this.threshold)return;c(this.list,"pointerEvents","none"),t.cancelable&&t.preventDefault(),this.dragging=!0,this.dir=e<0?1:-1;let{slides:i,prevIndex:s}=this,n=Math.abs(e),o=this.getIndex(s+this.dir),r=this._getDistance(s,o);for(;o!==s&&n>r;)this.drag-=r*this.dir,s=o,n-=r,o=this.getIndex(s+this.dir),r=this._getDistance(s,o);this.percent=n/r;const a=i[s],l=i[o],h=this.index!==o,u=s===o;let f;for(const d of [this.index,this.prevIndex])m([o,s],d)||(v(i[d],"itemhidden",[this]),u&&(f=!0,this.prevIndex=s));(this.index===s&&this.prevIndex!==s||f)&&v(i[this.index],"itemshown",[this]),h&&(this.prevIndex=s,this.index=o,!u&&v(a,"beforeitemhide",[this]),v(l,"beforeitemshow",[this])),this._transitioner=this._translate(Math.abs(this.percent),a,!u&&l),h&&(!u&&v(a,"itemhide",[this]),v(l,"itemshow",[this]));},end(){if(Bt(document,ms,this.move,gs),Bt(document,En,this.end,Tn),this.dragging)if(this.dragging=null,this.index===this.prevIndex)this.percent=1-this.percent,this.dir*=-1,this._show(!1,this.index,!0),this._transitioner=null;else {const t=(X?this.dir*(X?1:-1):this.dir)<0==this.prevPos>this.pos;this.index=t?this.index:this.prevIndex,t&&(this.percent=1-this.percent),this.show(this.dir>0&&!t||this.dir<0&&t?"next":"previous",!0);}c(this.list,{userSelect:"",pointerEvents:""}),this.drag=this.percent=null;},_getDistance(t,e){return this._getTransitioner(t,t!==e&&e).getDistance()||this.slides[t].offsetWidth}}};function ta(t){return c(t,"userSelect")!=="none"&&Qt(t.childNodes).some(e=>e.nodeType===3&&e.textContent.trim())}function ea(t){t._data={},t._updates=[...t.$options.update||[]];}function ia(t,e){t._updates.unshift(e);}function sa(t){delete t._data;}function wi(t,e="update"){t._connected&&t._updates.length&&(t._queued||(t._queued=new Set,J.read(()=>{t._connected&&na(t,t._queued),delete t._queued;})),t._queued.add(e.type||e));}function na(t,e){for(const{read:i,write:s,events:n=[]}of t._updates){if(!e.has("update")&&!n.some(r=>e.has(r)))continue;let o;i&&(o=i.call(t,t._data,e),o&&yt(o)&&wt(t._data,o)),s&&o!==!1&&J.write(()=>{t._connected&&s.call(t,t._data,e);});}}function oa(t){t._watches=[];for(const e of t.$options.watch||[])for(const[i,s]of Object.entries(e))Pn(t,s,i);t._initial=!0;}function Pn(t,e,i){t._watches.push({name:i,...yt(e)?e:{handler:e}});}function ra(t,e){for(const{name:i,handler:s,immediate:n=!0}of t._watches)(t._initial&&n||vt(e,i)&&!Je(e[i],t[i]))&&s.call(t,t[i],e[i]);t._initial=!1;}function aa(t){const{computed:e}=t.$options;if(t._computed={},e)for(const i in e)_n(t,i,e[i]);}function _n(t,e,i){t._hasComputed=!0,Object.defineProperty(t,e,{enumerable:!0,get(){const{_computed:s,$props:n,$el:o}=t;return vt(s,e)||(s[e]=(i.get||i).call(t,n,o)),s[e]},set(s){const{_computed:n}=t;n[e]=i.set?i.set.call(t,s):s,Y(n[e])&&delete n[e];}});}function la(t){t._hasComputed&&(ia(t,{read:()=>ra(t,An(t)),events:["resize","computed"]}),ca(),Le.add(t));}function ha(t){Le==null||Le.delete(t),An(t);}function An(t){const e={...t._computed};return t._computed={},e}let vs,Le;function ca(){vs||(Le=new Set,vs=new MutationObserver(()=>{for(const t of Le)wi(t,"computed");}),vs.observe(document,{childList:!0,subtree:!0}));}function ua(t){t._events=[];for(const e of t.$options.events||[])if(vt(e,"handler"))ws(t,e);else for(const i in e)ws(t,e[i],i);}function fa(t){t._events.forEach(e=>e()),delete t._events;}function ws(t,e,i){let{name:s,el:n,handler:o,capture:r,passive:a,delegate:l,filter:h,self:u}=yt(e)?e:{name:i,handler:e};if(n=it(n)?n.call(t,t):n||t.$el,Q(n)){n.forEach(f=>ws(t,{...e,el:f},i));return}!n||h&&!h.call(t)||t._events.push(x(n,s,l?D(l)?l:l.call(t,t):null,D(o)?t[o]:o.bind(t),{passive:a,capture:r,self:u}));}function da(t){t._observers=[];for(const e of t.$options.observe||[])if(vt(e,"handler"))Dn(t,e);else for(const i of e)Dn(t,i);}function On(t,...e){t._observers.push(...e);}function pa(t){for(const e of t._observers)e.disconnect();}function Dn(t,e){let{observe:i,target:s=t.$el,handler:n,options:o,filter:r,args:a}=e;if(r&&!r.call(t,t))return;const l=`_observe${t._observers.length}`;it(s)&&!vt(t,l)&&_n(t,l,()=>s.call(t,t)),n=D(n)?t[n]:n.bind(t),it(o)&&(o=o.call(t,t));const h=vt(t,l)?t[l]:s,u=i(h,n,o,a);it(s)&&Q(t[l])&&u.unobserve&&Pn(t,{handler:ga(u),immediate:!1},l),On(t,u);}function ga(t){return (e,i)=>{for(const s of i)!m(e,s)&&t.unobserve(s);for(const s of e)!m(i,s)&&t.observe(s);}}function ma(t){const e=Bn(t.$options);for(let s in e)Y(e[s])||(t.$props[s]=e[s]);const i=[t.$options.computed,t.$options.methods];for(let s in t.$props)s in e&&va(i,s)&&(t[s]=t.$props[s]);}function Bn(t){const e={},{args:i=[],props:s={},el:n,id:o}=t;if(!s)return e;for(const a in s){const l=Kt(a);let h=tt(n,l);Y(h)||(h=s[a]===Boolean&&h===""?!0:ls(s[a],h),!(l==="target"&&ot(h,"_"))&&(e[a]=h));}const r=Be(tt(n,o),i);for(const a in r){const l=be(a);Y(s[l])||(e[l]=ls(s[l],r[a]));}return e}function va(t,e){return t.every(i=>!i||!vt(i,e))}function wa(t){const{$options:e,$props:i}=t,{id:s,props:n,el:o}=e;if(!n)return;const r=Object.keys(n),a=r.map(h=>Kt(h)).concat(s),l=new MutationObserver(h=>{const u=Bn(e);h.some(({attributeName:f})=>{const d=f.replace("data-","");return (d===s?r:[be(d),be(f)]).some(g=>!Y(u[g])&&u[g]!==i[g])})&&t.$reset();});l.observe(o,{attributes:!0,attributeFilter:a.concat(a.map(h=>`data-${h}`))}),On(t,l);}function pe(t,e){var i;(i=t.$options[e])==null||i.forEach(s=>s.call(t));}function bs(t){t._connected||(ma(t),pe(t,"beforeConnect"),t._connected=!0,ua(t),ea(t),oa(t),da(t),wa(t),la(t),pe(t,"connected"),wi(t));}function $s(t){t._connected&&(pe(t,"beforeDisconnect"),fa(t),sa(t),pa(t),ha(t),pe(t,"disconnected"),t._connected=!1);}let ba=0;function Mn(t,e={}){e.data=ya(e,t.constructor.options),t.$options=De(t.constructor.options,e,t),t.$props={},t._uid=ba++,$a(t),xa(t),aa(t),pe(t,"created"),e.el&&t.$mount(e.el);}function $a(t){const{data:e={}}=t.$options;for(const i in e)t.$props[i]=t[i]=e[i];}function xa(t){const{methods:e}=t.$options;if(e)for(const i in e)t[i]=e[i].bind(t);}function ya({data:t={}},{args:e=[],props:i={}}){Q(t)&&(t=t.slice(0,e.length).reduce((s,n,o)=>(yt(n)?wt(s,n):s[e[o]]=n,s),{}));for(const s in t)Y(t[s])?delete t[s]:i[s]&&(t[s]=ls(i[s],t[s]));return t}const ft=function(t){Mn(this,t);};ft.util=yr,ft.options={},ft.version="3.16.26";const ka="uk-",Ut="__uikit__",ge={};function Nn(t,e){var i;const s=ka+Kt(t);if(!e)return yt(ge[s])&&(ge[s]=ft.extend(ge[s])),ge[s];t=be(t),ft[t]=(o,r)=>We(t,o,r);const n=yt(e)?{...e}:e.options;return n.id=s,n.name=t,(i=n.install)==null||i.call(n,ft,n,t),ft._initialized&&!n.functional&&requestAnimationFrame(()=>We(t,`[${s}],[data-${s}]`)),ge[s]=n}function We(t,e,i,...s){const n=Nn(t);return n.options.functional?new n({data:yt(e)?e:[e,i,...s]}):e?z(e).map(o)[0]:o();function o(r){const a=bi(r,t);if(a)if(i)a.$destroy();else return a;return new n({el:r,data:i})}}function Vt(t){return (t==null?void 0:t[Ut])||{}}function bi(t,e){return Vt(t)[e]}function Sa(t,e){t[Ut]||(t[Ut]={}),t[Ut][e.$options.name]=e;}function Ia(t,e){var i;(i=t[Ut])==null||delete i[e.$options.name],xe(t[Ut])||delete t[Ut];}function Ca(t){t.component=Nn,t.getComponents=Vt,t.getComponent=bi,t.update=zn,t.use=function(i){if(!i.installed)return i.call(null,this),i.installed=!0,this},t.mixin=function(i,s){s=(D(s)?this.component(s):s)||this,s.options=De(s.options,i);},t.extend=function(i){i||(i={});const s=this,n=function(r){Mn(this,r);};return n.prototype=Object.create(s.prototype),n.prototype.constructor=n,n.options=De(s.options,i),n.super=s,n.extend=s.extend,n};let e;Object.defineProperty(t,"container",{get(){return e||document.body},set(i){e=w(i);}});}function zn(t,e){t=t?H(t):document.body;for(const i of oe(t).reverse())Fn(i,e);It(t,i=>Fn(i,e));}function Fn(t,e){const i=Vt(t);for(const s in i)wi(i[s],e);}function Ta(t){t.prototype.$mount=function(e){const i=this;Sa(e,i),i.$options.el=e,B(e,document)&&bs(i);},t.prototype.$destroy=function(e=!1){const i=this,{el:s}=i.$options;s&&$s(i),pe(i,"destroy"),Ia(s,i),e&&lt(i.$el);},t.prototype.$create=We,t.prototype.$emit=function(e){wi(this,e);},t.prototype.$update=function(e=this.$el,i){zn(e,i);},t.prototype.$reset=function(){$s(this),bs(this);},t.prototype.$getComponent=bi,Object.defineProperties(t.prototype,{$el:{get(){return this.$options.el}},$container:Object.getOwnPropertyDescriptor(t,"container")});}function At(t,e=t.$el,i=""){if(e.id)return e.id;let s=`${t.$options.id}-${t._uid}${i}`;return w(`#${s}`)&&(s=At(t,e,`${i}-2`)),s}var Ea={i18n:{next:"Next slide",previous:"Previous slide",slideX:"Slide %s",slideLabel:"%s of %s",role:"String"},data:{selNav:!1,role:"region"},computed:{nav({selNav:t},e){return w(t,e)},navChildren(){return T(this.nav)},selNavItem({attrItem:t}){return `[${t}],[data-${t}]`},navItems(t,e){return z(this.selNavItem,e)}},watch:{nav(t,e){p(t,"role","tablist"),e&&this.$emit();},list(t){p(t,"role","presentation");},navChildren(t){p(t,"role","presentation");},navItems(t){for(const e of t){const i=tt(e,this.attrItem),s=w("a,button",e)||e;let n,o=null;if(bt(i)){const r=kt(i),a=this.slides[r];a&&(a.id||(a.id=At(this,a,`-item-${i}`)),o=a.id),n=this.t("slideX",$(i)+1),p(s,"role","tab");}else this.list&&(this.list.id||(this.list.id=At(this,this.list,"-items")),o=this.list.id),n=this.t(i);p(s,{"aria-controls":o,"aria-label":p(s,"aria-label")||n});}},slides(t){t.forEach((e,i)=>p(e,{role:this.nav?"tabpanel":"group","aria-label":this.t("slideLabel",i+1,this.length),"aria-roledescription":this.nav?null:"slide"}));},length(t){const e=this.navChildren.length;if(this.nav&&t!==e){Xi(this.nav);for(let i=0;i<t;i++)L(this.nav,`<li ${this.attrItem}="${i}"><a href></a></li>`);}}},connected(){p(this.$el,{role:this.role,"aria-roledescription":"carousel"});},update:[{write(){this.navItems.concat(this.nav).forEach(t=>t&&(t.hidden=!this.maxIndex)),this.updateNav();},events:["resize"]}],events:[{name:"click keydown",delegate(){return this.selNavItem},handler(t){U(t.target,"a,button")&&(t.type==="click"||t.keyCode===I.SPACE)&&(t.preventDefault(),this.show(tt(t.current,this.attrItem)));}},{name:"itemshow",handler:"updateNav"},{name:"keydown",delegate(){return this.selNavItem},handler(t){const{current:e,keyCode:i}=t,s=tt(e,this.attrItem);if(!bt(s))return;let n=i===I.HOME?0:i===I.END?"last":i===I.LEFT?"previous":i===I.RIGHT?"next":-1;~n&&(t.preventDefault(),this.show(n));}}],methods:{updateNav(){const t=this.getValidIndex();for(const e of this.navItems){const i=tt(e,this.attrItem),s=w("a,button",e)||e;if(bt(i)){const o=kt(i)===t;q(e,this.clsActive,o),p(s,{"aria-selected":o,tabindex:o?null:-1}),o&&s&&C(_(e),":focus-within")&&s.focus();}else q(e,"uk-invisible",this.finite&&(i==="previous"&&t===0||i==="next"&&t>=this.maxIndex));}}}},Hn={mixins:[Kr,Qr,Ea,vi],props:{clsActivated:Boolean,easing:String,index:Number,finite:Boolean,velocity:Number},data:()=>({easing:"ease",finite:!1,velocity:1,index:0,prevIndex:-1,stack:[],percent:0,clsActive:"uk-active",clsActivated:!1,Transitioner:!1,transitionOptions:{}}),connected(){this.prevIndex=-1,this.index=this.getValidIndex(this.$props.index),this.stack=[];},disconnected(){M(this.slides,this.clsActive);},computed:{duration({velocity:t},e){return Ln(e.offsetWidth/t)},list({selList:t},e){return w(t,e)},maxIndex(){return this.length-1},slides(){return T(this.list)},length(){return this.slides.length}},watch:{slides(t,e){e&&this.$emit();}},observe:pt(),methods:{show(t,e=!1){var i;if(this.dragging||!this.length)return;const{stack:s}=this,n=e?0:s.length,o=()=>{s.splice(n,1),s.length&&this.show(s.shift(),!0);};if(s[e?"unshift":"push"](t),!e&&s.length>1){s.length===2&&((i=this._transitioner)==null||i.forward(Math.min(this.duration,200)));return}const r=this.getIndex(this.index),a=P(this.slides,this.clsActive)&&this.slides[r],l=this.getIndex(t,this.index),h=this.slides[l];if(a===h){o();return}if(this.dir=Pa(t,r),this.prevIndex=r,this.index=l,a&&!v(a,"beforeitemhide",[this])||!v(h,"beforeitemshow",[this,a])){this.index=this.prevIndex,o();return}const u=this._show(a,h,e).then(()=>{a&&v(a,"itemhidden",[this]),v(h,"itemshown",[this]),s.shift(),this._transitioner=null,requestAnimationFrame(()=>s.length&&this.show(s.shift(),!0));});return a&&v(a,"itemhide",[this]),v(h,"itemshow",[this]),u},getIndex(t=this.index,e=this.index){return Z(rt(t,this.slides,e,this.finite),0,Math.max(0,this.maxIndex))},getValidIndex(t=this.index,e=this.prevIndex){return this.getIndex(t,e)},_show(t,e,i){if(this._transitioner=this._getTransitioner(t,e,this.dir,{easing:i?e.offsetWidth<600?"cubic-bezier(0.25, 0.46, 0.45, 0.94)":"cubic-bezier(0.165, 0.84, 0.44, 1)":this.easing,...this.transitionOptions}),!i&&!t)return this._translate(1),Promise.resolve();const{length:s}=this.stack;return this._transitioner[s>1?"forward":"show"](s>1?Math.min(this.duration,75+75/(s-1)):this.duration,this.percent)},_translate(t,e=this.prevIndex,i=this.index){const s=this._getTransitioner(e===i?!1:e,i);return s.translate(t),s},_getTransitioner(t=this.prevIndex,e=this.index,i=this.dir||1,s=this.transitionOptions){return new this.Transitioner($e(t)?this.slides[t]:t,$e(e)?this.slides[e]:e,i*(X?-1:1),s)}}};function Pa(t,e){return t==="next"?1:t==="previous"||t<e?-1:1}function Ln(t){return .5*t+300}var Wn={mixins:[Hn],props:{animation:String},data:{animation:"slide",clsActivated:"uk-transition-active",Animations:ps,Transitioner:Jr},computed:{animation({animation:t,Animations:e}){return {...e[t]||e.slide,name:t}},transitionOptions(){return {animation:this.animation}}},events:{beforeitemshow({target:t}){y(t,this.clsActive);},itemshown({target:t}){y(t,this.clsActivated);},itemhidden({target:t}){M(t,this.clsActive,this.clsActivated);}}},Rn={...ps,fade:{show(){return [{opacity:0},{opacity:1}]},percent(t){return 1-c(t,"opacity")},translate(t){return [{opacity:1-t},{opacity:t}]}},scale:{show(){return [{opacity:0,transform:de(1-.2)},{opacity:1,transform:de(1)}]},percent(t){return 1-c(t,"opacity")},translate(t){return [{opacity:1-t,transform:de(1-.2*t)},{opacity:t,transform:de(1-.2+.2*t)}]}}},jn={mixins:[ds,Wn],functional:!0,props:{delayControls:Number,preload:Number,videoAutoplay:Boolean,template:String},data:()=>({preload:1,videoAutoplay:!1,delayControls:3e3,items:[],cls:"uk-open",clsPage:"uk-lightbox-page",selList:".uk-lightbox-items",attrItem:"uk-lightbox-item",selClose:".uk-close-large",selCaption:".uk-lightbox-caption",pauseOnHover:!1,velocity:2,Animations:Rn,template:'<div class="uk-lightbox uk-overflow-hidden"> <ul class="uk-lightbox-items"></ul> <div class="uk-lightbox-toolbar uk-position-top uk-text-right uk-transition-slide-top uk-transition-opaque"> <button class="uk-lightbox-toolbar-icon uk-close-large" type="button" uk-close></button> </div> <a class="uk-lightbox-button uk-position-center-left uk-position-medium uk-transition-fade" href uk-slidenav-previous uk-lightbox-item="previous"></a> <a class="uk-lightbox-button uk-position-center-right uk-position-medium uk-transition-fade" href uk-slidenav-next uk-lightbox-item="next"></a> <div class="uk-lightbox-toolbar uk-lightbox-caption uk-position-bottom uk-text-center uk-transition-slide-bottom uk-transition-opaque"></div> </div>'}),created(){const t=w(this.template),e=w(this.selList,t);this.items.forEach(()=>L(e,"<li>"));const i=w("[uk-close]",t),s=this.t("close");i&&s&&(i.dataset.i18n=JSON.stringify({label:s})),this.$mount(L(this.container,t));},computed:{caption({selCaption:t},e){return w(t,e)}},events:[{name:`${ai} ${mt} keydown`,handler:"showControls"},{name:"click",self:!0,delegate(){return `${this.selList} > *`},handler(t){t.defaultPrevented||this.hide();}},{name:"shown",self:!0,handler(){this.showControls();}},{name:"hide",self:!0,handler(){this.hideControls(),M(this.slides,this.clsActive),E.stop(this.slides);}},{name:"hidden",self:!0,handler(){this.$destroy(!0);}},{name:"keyup",el(){return document},handler({keyCode:t}){if(!this.isToggled(this.$el)||!this.draggable)return;let e=-1;t===I.LEFT?e="previous":t===I.RIGHT?e="next":t===I.HOME?e=0:t===I.END&&(e="last"),~e&&this.show(e);}},{name:"beforeitemshow",handler(t){this.isToggled()||(this.draggable=!1,t.preventDefault(),this.toggleElement(this.$el,!0,!1),this.animation=Rn.scale,M(t.target,this.clsActive),this.stack.splice(1,0,this.index));}},{name:"itemshow",handler(){Nt(this.caption,this.getItem().caption||"");for(let t=-this.preload;t<=this.preload;t++)this.loadItem(this.index+t);}},{name:"itemshown",handler(){this.draggable=this.$props.draggable;}},{name:"itemload",async handler(t,e){const{source:i,type:s,alt:n="",poster:o,attrs:r={}}=e;if(this.setItem(e,"<span uk-spinner></span>"),!i)return;let a;const l={allowfullscreen:"",style:"max-width: 100%; box-sizing: border-box;","uk-responsive":"","uk-video":`${this.videoAutoplay}`};if(s==="image"||i.match(/\.(avif|jpe?g|jfif|a?png|gif|svg|webp)($|\?)/i)){const h=Re("img",{src:i,alt:n,...r});x(h,"load",()=>this.setItem(e,h)),x(h,"error",()=>this.setError(e));}else if(s==="video"||i.match(/\.(mp4|webm|ogv)($|\?)/i)){const h=Re("video",{src:i,poster:o,controls:"",playsinline:"","uk-video":`${this.videoAutoplay}`,...r});x(h,"loadedmetadata",()=>this.setItem(e,h)),x(h,"error",()=>this.setError(e));}else if(s==="iframe"||i.match(/\.(html|php)($|\?)/i))this.setItem(e,Re("iframe",{src:i,allowfullscreen:"",class:"uk-lightbox-iframe",...r}));else if(a=i.match(/\/\/(?:.*?youtube(-nocookie)?\..*?(?:[?&]v=|\/shorts\/)|youtu\.be\/)([\w-]{11})[&?]?(.*)?/))this.setItem(e,Re("iframe",{src:`https://www.youtube${a[1]||""}.com/embed/${a[2]}${a[3]?`?${a[3]}`:""}`,width:1920,height:1080,...l,...r}));else if(a=i.match(/\/\/.*?vimeo\.[a-z]+\/(\d+)[&?]?(.*)?/))try{const{height:h,width:u}=await(await fetch(`https://vimeo.com/api/oembed.json?maxwidth=1920&url=${encodeURI(i)}`,{credentials:"omit"})).json();this.setItem(e,Re("iframe",{src:`https://player.vimeo.com/video/${a[1]}${a[2]?`?${a[2]}`:""}`,width:u,height:h,...l,...r}));}catch{this.setError(e);}}}],methods:{loadItem(t=this.index){const e=this.getItem(t);this.getSlide(e).childElementCount||v(this.$el,"itemload",[e]);},getItem(t=this.index){return this.items[rt(t,this.slides)]},setItem(t,e){v(this.$el,"itemloaded",[this,Nt(this.getSlide(t),e)]);},getSlide(t){return this.slides[this.items.indexOf(t)]},setError(t){this.setItem(t,'<span uk-icon="icon: bolt; ratio: 2"></span>');},showControls(){clearTimeout(this.controlsTimer),this.controlsTimer=setTimeout(this.hideControls,this.delayControls),y(this.$el,"uk-active","uk-transition-active");},hideControls(){M(this.$el,"uk-active","uk-transition-active");}}};function Re(t,e){const i=zt(`<${t}>`);return p(i,e),i}var _a={install:Aa,props:{toggle:String},data:{toggle:"a"},computed:{toggles({toggle:t},e){return z(t,e)}},watch:{toggles(t){this.hide();for(const e of t)G(e,"a")&&p(e,"role","button");}},disconnected(){this.hide();},events:{name:"click",delegate(){return `${this.toggle}:not(.uk-disabled)`},handler(t){t.preventDefault(),this.show(t.current);}},methods:{show(t){const e=_s(this.toggles.map(qn),"source");if(ee(t)){const{source:i}=qn(t);t=xt(e,({source:s})=>i===s);}return this.panel=this.panel||this.$create("lightboxPanel",{...this.$props,items:e}),x(this.panel.$el,"hidden",()=>this.panel=null),this.panel.show(t)},hide(){var t;return (t=this.panel)==null?void 0:t.hide()}}};function Aa(t,e){t.lightboxPanel||t.component("lightboxPanel",jn),wt(e.props,t.component("lightboxPanel").options.props);}function qn(t){const e={};for(const i of ["href","caption","type","poster","alt","attrs"])e[i==="href"?"source":i]=tt(t,i);return e.attrs=Be(e.attrs),e}var Oa={mixins:[Fe],functional:!0,args:["message","status"],data:{message:"",status:"",timeout:5e3,group:null,pos:"top-center",clsContainer:"uk-notification",clsClose:"uk-notification-close",clsMsg:"uk-notification-message"},install:Da,computed:{marginProp({pos:t}){return `margin${ot(t,"top")?"Top":"Bottom"}`},startProps(){return {opacity:0,[this.marginProp]:-this.$el.offsetHeight}}},created(){const t=`${this.clsContainer}-${this.pos}`;let e=w(`.${t}`,this.container);(!e||!R(e))&&(e=L(this.container,`<div class="${this.clsContainer} ${t}"></div>`)),this.$mount(L(e,`<div class="${this.clsMsg}${this.status?` ${this.clsMsg}-${this.status}`:""}" role="alert"> <a href class="${this.clsClose}" data-uk-close></a> <div>${this.message}</div> </div>`));},async connected(){const t=$(c(this.$el,this.marginProp));await E.start(c(this.$el,this.startProps),{opacity:1,[this.marginProp]:t}),this.timeout&&(this.timer=setTimeout(this.close,this.timeout));},events:{click(t){U(t.target,'a[href="#"],a[href=""]')&&t.preventDefault(),this.close();},[Rt](){this.timer&&clearTimeout(this.timer);},[Oe](){this.timeout&&(this.timer=setTimeout(this.close,this.timeout));}},methods:{async close(t){const e=i=>{const s=_(i);v(i,"close",[this]),lt(i),s!=null&&s.hasChildNodes()||lt(s);};this.timer&&clearTimeout(this.timer),t||await E.start(this.$el,this.startProps),e(this.$el);}}};function Da(t){t.notification.closeAll=function(e,i){It(document.body,s=>{const n=t.getComponent(s,"notification");n&&(!e||e===n.group)&&n.close(i);});};}var $i={props:{media:Boolean},data:{media:!1},connected(){const t=Ba(this.media,this.$el);if(this.matchMedia=!0,t){this.mediaObj=window.matchMedia(t);const e=()=>{this.matchMedia=this.mediaObj.matches,v(this.$el,Mt("mediachange",!1,!0,[this.mediaObj]));};this.offMediaObj=x(this.mediaObj,"change",()=>{e(),this.$emit("resize");}),e();}},disconnected(){var t;(t=this.offMediaObj)==null||t.call(this);}};function Ba(t,e){if(D(t)){if(ot(t,"@"))t=$(c(e,`--uk-breakpoint-${t.substr(1)}`));else if(isNaN(t))return t}return t&&bt(t)?`(min-width: ${t}px)`:""}function Un(t){return Math.ceil(Math.max(0,...z("[stroke]",t).map(e=>{try{return e.getTotalLength()}catch{return 0}})))}const xi={x:yi,y:yi,rotate:yi,scale:yi,color:xs,backgroundColor:xs,borderColor:xs,blur:Yt,hue:Yt,fopacity:Yt,grayscale:Yt,invert:Yt,saturate:Yt,sepia:Yt,opacity:Na,stroke:za,bgx:Gn,bgy:Gn},{keys:Vn}=Object;var Yn={mixins:[$i],props:Zn(Vn(xi),"list"),data:Zn(Vn(xi),void 0),computed:{props(t,e){const i={};for(const n in t)n in xi&&!Y(t[n])&&(i[n]=t[n].slice());const s={};for(const n in i)s[n]=xi[n](n,e,i[n],i);return s}},events:{load(){this.$emit();}},methods:{reset(){for(const t in this.getCss(0))c(this.$el,t,"");},getCss(t){const e={transform:"",filter:""};for(const i in this.props)this.props[i](e,Z(t));return e.willChange=Object.keys(e).filter(i=>e[i]!=="").map(ei).join(","),e}}};function yi(t,e,i){let s=Si(i)||{x:"px",y:"px",rotate:"deg"}[t]||"",n;return t==="x"||t==="y"?(t=`translate${Tt(t)}`,n=o=>$($(o).toFixed(s==="px"?0:6))):t==="scale"&&(s="",n=o=>Si([o])?ht(o,"width",e,!0)/e.offsetWidth:$(o)),i.length===1&&i.unshift(t==="scale"?1:0),i=me(i,n),(o,r)=>{o.transform+=` ${t}(${je(i,r)}${s})`;}}function xs(t,e,i){return i.length===1&&i.unshift(qe(e,t,"")),i=me(i,s=>Ma(e,s)),(s,n)=>{const[o,r,a]=Kn(i,n),l=o.map((h,u)=>(h+=a*(r[u]-h),u===3?$(h):parseInt(h,10))).join(",");s[t]=`rgba(${l})`;}}function Ma(t,e){return qe(t,"color",e).split(/[(),]/g).slice(1,-1).concat(1).slice(0,4).map($)}function Yt(t,e,i){i.length===1&&i.unshift(0);const s=Si(i)||{blur:"px",hue:"deg"}[t]||"%";return t={fopacity:"opacity",hue:"hue-rotate"}[t]||t,i=me(i),(n,o)=>{const r=je(i,o);n.filter+=` ${t}(${r+s})`;}}function Na(t,e,i){return i.length===1&&i.unshift(qe(e,t,"")),i=me(i),(s,n)=>{s[t]=je(i,n);}}function za(t,e,i){i.length===1&&i.unshift(0);const s=Si(i),n=Un(e);return i=me(i.reverse(),o=>(o=$(o),s==="%"?o*n/100:o)),i.some(([o])=>o)?(c(e,"strokeDasharray",n),(o,r)=>{o.strokeDashoffset=je(i,r);}):S}function Gn(t,e,i,s){i.length===1&&i.unshift(0);const n=t==="bgy"?"height":"width";s[t]=me(i,a=>ht(a,n,e));const o=["bgx","bgy"].filter(a=>a in s);if(o.length===2&&t==="bgx")return S;if(qe(e,"backgroundSize","")==="cover")return Fa(t,e,i,s);const r={};for(const a of o)r[a]=Xn(e,a);return Jn(o,r,s)}function Fa(t,e,i,s){const n=Ha(e);if(!n.width)return S;const o={width:e.offsetWidth,height:e.offsetHeight},r=["bgx","bgy"].filter(u=>u in s),a={};for(const u of r){const f=s[u].map(([F])=>F),d=Math.min(...f),g=Math.max(...f),O=f.indexOf(d)<f.indexOf(g),N=g-d;a[u]=`${(O?-N:0)-(O?d:g)}px`,o[u==="bgy"?"height":"width"]+=N;}const l=Qe.cover(n,o);for(const u of r){const f=u==="bgy"?"height":"width",d=l[f]-o[f];a[u]=`max(${Xn(e,u)},-${d}px) + ${a[u]}`;}const h=Jn(r,a,s);return (u,f)=>{h(u,f),u.backgroundSize=`${l.width}px ${l.height}px`,u.backgroundRepeat="no-repeat";}}function Xn(t,e){return qe(t,`background-position-${e.substr(-1)}`,"")}function Jn(t,e,i){return function(s,n){for(const o of t){const r=je(i[o],n);s[`background-position-${o.substr(-1)}`]=`calc(${e[o]} + ${r}px)`;}}}const ki={};function Ha(t){const e=c(t,"backgroundImage").replace(/^none|url\(["']?(.+?)["']?\)$/,"$1");if(ki[e])return ki[e];const i=new Image;return e&&(i.src=e,!i.naturalWidth)?(i.onload=()=>{ki[e]=ys(i),v(t,Mt("load",!1));},ys(i)):ki[e]=ys(i)}function ys(t){return {width:t.naturalWidth,height:t.naturalHeight}}function me(t,e=$){const i=[],{length:s}=t;let n=0;for(let o=0;o<s;o++){let[r,a]=D(t[o])?t[o].trim().split(/ (?![^(]*\))/):[t[o]];if(r=e(r),a=a?$(a)/100:null,o===0?a===null?a=0:a&&i.push([r,0]):o===s-1&&(a===null?a=1:a!==1&&(i.push([r,a]),a=1)),i.push([r,a]),a===null)n++;else if(n){const l=i[o-n-1][1],h=(a-l)/(n+1);for(let u=n;u>0;u--)i[o-u][1]=l+h*(n-u+1);n=0;}}return i}function Kn(t,e){const i=xt(t.slice(1),([,s])=>e<=s)+1;return [t[i-1][0],t[i][0],(e-t[i-1][1])/(t[i][1]-t[i-1][1])]}function je(t,e){const[i,s,n]=Kn(t,e);return i+Math.abs(i-s)*n*(i<s?1:-1)}const La=/^-?\d+(?:\.\d+)?(\S+)?/;function Si(t,e){var i;for(const s of t){const n=(i=s.match)==null?void 0:i.call(s,La);if(n)return n[1]}return e}function qe(t,e,i){const s=t.style[e],n=c(c(t,e,i),e);return t.style[e]=s,n}function Zn(t,e){return t.reduce((i,s)=>(i[s]=e,i),{})}var Wa={mixins:[Yn],props:{target:String,viewport:Number,easing:Number,start:String,end:String},data:{target:!1,viewport:1,easing:1,start:0,end:0},computed:{target({target:t},e){return Qn(t&&at(t,e)||e)},start({start:t}){return ht(t,"height",this.target,!0)},end({end:t,viewport:e}){return ht(t||(e=(1-e)*100)&&`${e}vh+${e}%`,"height",this.target,!0)}},observe:[fn(),di({target:({target:t})=>t}),pt({target:({$el:t,target:e})=>[t,e,Ct(e,!0)]})],update:{read({percent:t},e){if(e.has("scroll")||(t=!1),!R(this.$el))return !1;if(!this.matchMedia)return;const i=t;return t=Ra(os(this.target,this.start,this.end),this.easing),{percent:t,style:i===t?!1:this.getCss(t)}},write({style:t}){if(!this.matchMedia){this.reset();return}t&&c(this.$el,t);},events:["scroll","resize"]}};function Ra(t,e){return e>=0?Math.pow(t,e+1):1-Math.pow(1-t,1-e)}function Qn(t){return t?"offsetTop"in t?t:Qn(_(t)):document.documentElement}var to={update:{write(){if(this.stack.length||this.dragging)return;const t=this.getValidIndex(this.index);!~this.prevIndex||this.index!==t?this.show(t):this._translate(1,this.prevIndex,this.index);},events:["resize"]}},eo={observe:Ne({target:({slides:t})=>t,targets:t=>t.getAdjacentSlides()})};function ja(t,e,i,{center:s,easing:n,list:o}){const r=t?Ue(t,o,s):Ue(e,o,s)+b(e).width*i,a=e?Ue(e,o,s):r+b(t).width*i*(X?-1:1);let l;return {dir:i,show(h,u=0,f){const d=f?"linear":n;return h-=Math.round(h*Z(u,-1,1)),this.translate(u),u=t?u:Z(u,0,1),ks(this.getItemIn(),"itemin",{percent:u,duration:h,timing:d,dir:i}),t&&ks(this.getItemIn(!0),"itemout",{percent:1-u,duration:h,timing:d,dir:i}),new Promise(g=>{l||(l=g),E.start(o,{transform:W(-a*(X?-1:1),"px")},h,d).then(l,S);})},cancel(){return E.cancel(o)},reset(){c(o,"transform","");},async forward(h,u=this.percent()){return await this.cancel(),this.show(h,u,!0)},translate(h){const u=this.getDistance()*i*(X?-1:1);c(o,"transform",W(Z(-a+(u-u*h),-Ii(o),b(o).width)*(X?-1:1),"px"));const f=this.getActives(),d=this.getItemIn(),g=this.getItemIn(!0);h=t?Z(h,-1,1):0;for(const O of T(o)){const N=m(f,O),F=O===d,Ot=O===g,Es=F||!Ot&&(N||i*(X?-1:1)===-1^Ci(O,o)>Ci(t||e));ks(O,`itemtranslate${Es?"in":"out"}`,{dir:i,percent:Ot?1-h:F?h:N?1:0});}},percent(){return Math.abs((c(o,"transform").split(",")[4]*(X?-1:1)+r)/(a-r))},getDistance(){return Math.abs(a-r)},getItemIn(h=!1){let u=this.getActives(),f=so(o,Ue(e||t,o,s));if(h){const d=u;u=f,f=d;}return f[xt(f,d=>!m(u,d))]},getActives(){return so(o,Ue(t||e,o,s))}}}function Ue(t,e,i){const s=Ci(t,e);return i?s-qa(t,e):Math.min(s,io(e))}function io(t){return Math.max(0,Ii(t)-b(t).width)}function Ii(t){return Dt(T(t),e=>b(e).width)}function qa(t,e){return b(e).width/2-b(t).width/2}function Ci(t,e){return t&&(Ki(t).left+(X?b(t).width-b(e).width:0))*(X?-1:1)||0}function so(t,e){e-=1;const i=b(t).width,s=e+i+2;return T(t).filter(n=>{const o=Ci(n,t),r=o+Math.min(b(n).width,i);return o>=e&&r<=s})}function ks(t,e,i){v(t,Mt(e,!1,!1,i));}var Ua={mixins:[st,Hn,to,eo],props:{center:Boolean,sets:Boolean},data:{center:!1,sets:!1,attrItem:"uk-slider-item",selList:".uk-slider-items",selNav:".uk-slider-nav",clsContainer:"uk-slider-container",Transitioner:ja},computed:{avgWidth(){return Ii(this.list)/this.length},finite({finite:t}){return t||Va(this.list,this.center)},maxIndex(){if(!this.finite||this.center&&!this.sets)return this.length-1;if(this.center)return ne(this.sets);let t=0;const e=io(this.list),i=xt(this.slides,s=>{if(t>=e)return !0;t+=b(s).width;});return ~i?i:this.length-1},sets({sets:t}){if(!t)return;let e=0;const i=[],s=b(this.list).width;for(let n=0;n<this.length;n++){const o=b(this.slides[n]).width;e+o>s&&(e=0),this.center?e<s/2&&e+o+b(rt(+n+1,this.slides)).width/2>s/2&&(i.push(+n),e=s/2-o/2):e===0&&i.push(Math.min(+n,this.maxIndex)),e+=o;}if(i.length)return i},transitionOptions(){return {center:this.center,list:this.list}},slides(){return T(this.list).filter(R)}},connected(){q(this.$el,this.clsContainer,!w(`.${this.clsContainer}`,this.$el));},observe:pt({target:({slides:t})=>t}),update:{write(){for(const t of this.navItems){const e=kt(tt(t,this.attrItem));e!==!1&&(t.hidden=!this.maxIndex||e>this.maxIndex||this.sets&&!m(this.sets,e));}this.length&&!this.dragging&&!this.stack.length&&(this.reorder(),this._translate(1)),this.updateActiveClasses();},events:["resize"]},events:{beforeitemshow(t){!this.dragging&&this.sets&&this.stack.length<2&&!m(this.sets,this.index)&&(this.index=this.getValidIndex());const e=Math.abs(this.index-this.prevIndex+(this.dir>0&&this.index<this.prevIndex||this.dir<0&&this.index>this.prevIndex?(this.maxIndex+1)*this.dir:0));if(!this.dragging&&e>1){for(let s=0;s<e;s++)this.stack.splice(1,0,this.dir>0?"next":"previous");t.preventDefault();return}const i=this.dir<0||!this.slides[this.prevIndex]?this.index:this.prevIndex;this.duration=Ln(this.avgWidth/this.velocity)*(b(this.slides[i]).width/this.avgWidth),this.reorder();},itemshow(){~this.prevIndex&&y(this._getTransitioner().getItemIn(),this.clsActive);},itemshown(){this.updateActiveClasses();}},methods:{reorder(){if(this.finite){c(this.slides,"order","");return}const t=this.dir>0&&this.slides[this.prevIndex]?this.prevIndex:this.index;if(this.slides.forEach((n,o)=>c(n,"order",this.dir>0&&o<t?1:this.dir<0&&o>=this.index?-1:"")),!this.center)return;const e=this.slides[t];let i=b(this.list).width/2-b(e).width/2,s=0;for(;i>0;){const n=this.getIndex(--s+t,t),o=this.slides[n];c(o,"order",n>t?-2:-1),i-=b(o).width;}},updateActiveClasses(){const t=this._getTransitioner(this.index).getActives(),e=[this.clsActive,(!this.sets||m(this.sets,$(this.index)))&&this.clsActivated||""];for(const i of this.slides){const s=m(t,i);q(i,e,s),p(i,"aria-hidden",!s);for(const n of z(Se,i))vt(n,"_tabindex")||(n._tabindex=p(n,"tabindex")),p(n,"tabindex",s?n._tabindex:-1);}},getValidIndex(t=this.index,e=this.prevIndex){if(t=this.getIndex(t,e),!this.sets)return t;let i;do{if(m(this.sets,t))return t;i=t,t=this.getIndex(t+this.dir,e);}while(t!==i);return t},getAdjacentSlides(){const{width:t}=b(this.list),e=-t,i=t*2,s=b(this.slides[this.index]).width,n=this.center?t/2-s/2:0,o=new Set;for(const r of [-1,1]){let a=n+(r>0?s:0),l=0;do{const h=this.slides[this.getIndex(this.index+r+l++*r)];a+=b(h).width*r,o.add(h);}while(this.length>l&&a>e&&a<i)}return Array.from(o)}}};function Va(t,e){if(!t||t.length<2)return !0;const{width:i}=b(t);if(!e)return Math.ceil(Ii(t))<Math.trunc(i+Ya(t));const s=T(t),n=Math.trunc(i/2);for(const o in s){const r=s[o],a=b(r).width,l=new Set([r]);let h=0;for(const u of [-1,1]){let f=a/2,d=0;for(;f<n;){const g=s[rt(+o+u+d++*u,s)];if(l.has(g))return !0;f+=b(g).width,l.add(g);}h=Math.max(h,a/2+b(s[rt(+o+u,s)]).width/2-(f-n));}if(h>Dt(s.filter(u=>!l.has(u)),u=>b(u).width))return !0}return !1}function Ya(t){return Math.max(0,...T(t).map(e=>b(e).width))}var no={mixins:[Yn],data:{selItem:"!li"},beforeConnect(){this.item=at(this.selItem,this.$el);},disconnected(){this.item=null;},events:[{name:"itemin itemout",self:!0,el(){return this.item},handler({type:t,detail:{percent:e,duration:i,timing:s,dir:n}}){J.read(()=>{if(!this.matchMedia)return;const o=this.getCss(ro(t,n,e)),r=this.getCss(oo(t)?.5:n>0?1:0);J.write(()=>{c(this.$el,o),E.start(this.$el,r,i,s).catch(S);});});}},{name:"transitioncanceled transitionend",self:!0,el(){return this.item},handler(){E.cancel(this.$el);}},{name:"itemtranslatein itemtranslateout",self:!0,el(){return this.item},handler({type:t,detail:{percent:e,dir:i}}){J.read(()=>{if(!this.matchMedia){this.reset();return}const s=this.getCss(ro(t,i,e));J.write(()=>c(this.$el,s));});}}]};function oo(t){return Zt(t,"in")}function ro(t,e,i){return i/=2,oo(t)^e<0?i:1-i}var Ga={...ps,fade:{show(){return [{opacity:0,zIndex:0},{zIndex:-1}]},percent(t){return 1-c(t,"opacity")},translate(t){return [{opacity:1-t,zIndex:0},{zIndex:-1}]}},scale:{show(){return [{opacity:0,transform:de(1+.5),zIndex:0},{zIndex:-1}]},percent(t){return 1-c(t,"opacity")},translate(t){return [{opacity:1-t,transform:de(1+.5*t),zIndex:0},{zIndex:-1}]}},pull:{show(t){return t<0?[{transform:W(30),zIndex:-1},{transform:W(),zIndex:0}]:[{transform:W(-100),zIndex:0},{transform:W(),zIndex:-1}]},percent(t,e,i){return i<0?1-He(e):He(t)},translate(t,e){return e<0?[{transform:W(30*t),zIndex:-1},{transform:W(-100*(1-t)),zIndex:0}]:[{transform:W(-t*100),zIndex:0},{transform:W(30*(1-t)),zIndex:-1}]}},push:{show(t){return t<0?[{transform:W(100),zIndex:0},{transform:W(),zIndex:-1}]:[{transform:W(-30),zIndex:-1},{transform:W(),zIndex:0}]},percent(t,e,i){return i>0?1-He(e):He(t)},translate(t,e){return e<0?[{transform:W(t*100),zIndex:0},{transform:W(-30*(1-t)),zIndex:-1}]:[{transform:W(-30*t),zIndex:-1},{transform:W(100*(1-t)),zIndex:0}]}}},Xa={mixins:[st,Wn,to,eo],props:{ratio:String,minHeight:Number,maxHeight:Number},data:{ratio:"16:9",minHeight:!1,maxHeight:!1,selList:".uk-slideshow-items",attrItem:"uk-slideshow-item",selNav:".uk-slideshow-nav",Animations:Ga},update:{read(){if(!this.list)return !1;let[t,e]=this.ratio.split(":").map(Number);return e=e*this.list.offsetWidth/t||0,this.minHeight&&(e=Math.max(this.minHeight,e)),this.maxHeight&&(e=Math.min(this.maxHeight,e)),{height:e-he(this.list,"height","content-box")}},write({height:t}){t>0&&c(this.list,"minHeight",t);},events:["resize"]},methods:{getAdjacentSlides(){return [1,-1].map(t=>this.slides[this.getIndex(this.index+t)])}}},Ja={mixins:[st,yn],props:{group:String,threshold:Number,clsItem:String,clsPlaceholder:String,clsDrag:String,clsDragState:String,clsBase:String,clsNoDrag:String,clsEmpty:String,clsCustom:String,handle:String},data:{group:!1,threshold:5,clsItem:"uk-sortable-item",clsPlaceholder:"uk-sortable-placeholder",clsDrag:"uk-sortable-drag",clsDragState:"uk-drag",clsBase:"uk-sortable",clsNoDrag:"uk-sortable-nodrag",clsEmpty:"uk-sortable-empty",clsCustom:"",handle:!1,pos:{}},created(){for(const t of ["init","start","move","end"]){const e=this[t];this[t]=i=>{wt(this.pos,le(i)),e(i);};}},events:{name:mt,passive:!1,handler:"init"},computed:{target(){return (this.$el.tBodies||[this.$el])[0]},items(){return T(this.target)},isEmpty(){return xe(this.items)},handles({handle:t},e){return t?z(t,e):this.items}},watch:{isEmpty(t){q(this.target,this.clsEmpty,t);},handles(t,e){c(e,{touchAction:"",userSelect:""}),c(t,{touchAction:Wt?"none":"",userSelect:"none"});}},update:{write(t){if(!this.drag||!_(this.placeholder))return;const{pos:{x:e,y:i},origin:{offsetTop:s,offsetLeft:n},placeholder:o}=this;c(this.drag,{top:i-s,left:e-n});const r=this.getSortable(document.elementFromPoint(e,i));if(!r)return;const{items:a}=r;if(a.some(E.inProgress))return;const l=tl(a,{x:e,y:i});if(a.length&&(!l||l===o))return;const h=this.getSortable(o),u=el(r.target,l,o,e,i,r===h&&t.moved!==l);u!==!1&&(u&&o===u||(r!==h?(h.remove(o),t.moved=l):delete t.moved,r.insert(o,u),this.touched.add(r)));},events:["move"]},methods:{init(t){const{target:e,button:i,defaultPrevented:s}=t,[n]=this.items.filter(o=>B(e,o));!n||s||i>0||ji(e)||B(e,`.${this.clsNoDrag}`)||this.handle&&!B(e,this.handle)||(t.preventDefault(),this.touched=new Set([this]),this.placeholder=n,this.origin={target:e,index:re(n),...this.pos},x(document,ai,this.move),x(document,_t,this.end),this.threshold||this.start(t));},start(t){this.drag=Qa(this.$container,this.placeholder);const{left:e,top:i}=this.placeholder.getBoundingClientRect();wt(this.origin,{offsetLeft:this.pos.x-e,offsetTop:this.pos.y-i}),y(this.drag,this.clsDrag,this.clsCustom),y(this.placeholder,this.clsPlaceholder),y(this.items,this.clsItem),y(document.documentElement,this.clsDragState),v(this.$el,"start",[this,this.placeholder]),Ka(this.pos),this.move(t);},move(t){this.drag?this.$emit("move"):(Math.abs(this.pos.x-this.origin.x)>this.threshold||Math.abs(this.pos.y-this.origin.y)>this.threshold)&&this.start(t);},end(){if(Bt(document,ai,this.move),Bt(document,_t,this.end),!this.drag)return;Za();const t=this.getSortable(this.placeholder);this===t?this.origin.index!==re(this.placeholder)&&v(this.$el,"moved",[this,this.placeholder]):(v(t.$el,"added",[t,this.placeholder]),v(this.$el,"removed",[this,this.placeholder])),v(this.$el,"stop",[this,this.placeholder]),lt(this.drag),this.drag=null;for(const{clsPlaceholder:e,clsItem:i}of this.touched)for(const s of this.touched)M(s.items,e,i);this.touched=null,M(document.documentElement,this.clsDragState);},insert(t,e){y(this.items,this.clsItem);const i=()=>e?ii(e,t):L(this.target,t);this.animate(i);},remove(t){B(t,this.target)&&this.animate(()=>lt(t));},getSortable(t){do{const e=this.$getComponent(t,"sortable");if(e&&(e===this||this.group!==!1&&e.group===this.group))return e}while(t=_(t))}}};let ao;function Ka(t){let e=Date.now();ao=setInterval(()=>{let{x:i,y:s}=t;s+=document.scrollingElement.scrollTop;const n=(Date.now()-e)*.3;e=Date.now(),fe(document.elementFromPoint(i,t.y)).reverse().some(o=>{let{scrollTop:r,scrollHeight:a}=o;const{top:l,bottom:h,height:u}=ct(o);if(l<s&&l+35>s)r-=n;else if(h>s&&h-35<s)r+=n;else return;if(r>0&&r<a-u)return o.scrollTop=r,!0});},15);}function Za(){clearInterval(ao);}function Qa(t,e){let i;if(G(e,"li","tr")){i=w("<div>"),L(i,e.cloneNode(!0).children);for(const s of e.getAttributeNames())p(i,s,e.getAttribute(s));}else i=e.cloneNode(!0);return L(t,i),c(i,"margin","0","important"),c(i,{boxSizing:"border-box",width:e.offsetWidth,height:e.offsetHeight,padding:c(e,"padding")}),et(i.firstElementChild,et(e.firstElementChild)),i}function tl(t,e){return t[xt(t,i=>Ze(e,i.getBoundingClientRect()))]}function el(t,e,i,s,n,o){if(!T(t).length)return;const r=e.getBoundingClientRect();if(!o)return il(t,i)||n<r.top+r.height/2?e:e.nextElementSibling;const a=i.getBoundingClientRect(),l=lo([r.top,r.bottom],[a.top,a.bottom]),[h,u,f,d]=l?[s,"width","left","right"]:[n,"height","top","bottom"],g=a[u]<r[u]?r[u]-a[u]:0;return a[f]<r[f]?g&&h<r[f]+g?!1:e.nextElementSibling:g&&h>r[d]-g?!1:e}function il(t,e){const i=T(t).length===1;i&&L(t,e);const s=T(t),n=s.some((o,r)=>{const a=o.getBoundingClientRect();return s.slice(r+1).some(l=>{const h=l.getBoundingClientRect();return !lo([a.left,a.right],[h.left,h.right])})});return i&&lt(e),n}function lo(t,e){return t[1]>e[0]&&e[1]>t[0]}var ho={props:{pos:String,offset:null,flip:Boolean,shift:Boolean,inset:Boolean},data:{pos:`bottom-${X?"right":"left"}`,offset:!1,flip:!0,shift:!0,inset:!1},connected(){this.pos=this.$props.pos.split("-").concat("center").slice(0,2),[this.dir,this.align]=this.pos,this.axis=m(["top","bottom"],this.dir)?"y":"x";},methods:{positionAt(t,e,i){let s=[this.getPositionOffset(t),this.getShiftOffset(t)];const n=[this.flip&&"flip",this.shift&&"shift"],o={element:[this.inset?this.dir:ri(this.dir),this.align],target:[this.dir,this.align]};if(this.axis==="y"){for(const l in o)o[l].reverse();s.reverse(),n.reverse();}const r=sl(t),a=b(t);c(t,{top:-a.height,left:-a.width}),en(t,e,{attach:o,offset:s,boundary:i,placement:n,viewportOffset:this.getViewportOffset(t)}),r();},getPositionOffset(t){return ht(this.offset===!1?c(t,"--uk-position-offset"):this.offset,this.axis==="x"?"width":"height",t)*(m(["left","top"],this.dir)?-1:1)*(this.inset?-1:1)},getShiftOffset(t){return this.align==="center"?0:ht(c(t,"--uk-position-shift-offset"),this.axis==="y"?"width":"height",t)*(m(["left","top"],this.align)?1:-1)},getViewportOffset(t){return ht(c(t,"--uk-position-viewport-offset"))}}};function sl(t){const e=Ct(t),{scrollTop:i}=e;return ()=>{i!==e.scrollTop&&(e.scrollTop=i);}}var nl={mixins:[Fe,qt,ho],args:"title",props:{delay:Number,title:String},data:{pos:"top",title:"",delay:0,animation:["uk-animation-scale-up"],duration:100,cls:"uk-active"},beforeConnect(){this.id=At(this,{}),this._hasTitle=$t(this.$el,"title"),p(this.$el,{title:"","aria-describedby":this.id}),ol(this.$el);},disconnected(){this.hide(),p(this.$el,"title")||p(this.$el,"title",this._hasTitle?this.title:null);},methods:{show(){this.isToggled(this.tooltip||null)||!this.title||(clearTimeout(this.showTimer),this.showTimer=setTimeout(this._show,this.delay));},async hide(){C(this.$el,"input:focus")||(clearTimeout(this.showTimer),this.isToggled(this.tooltip||null)&&await this.toggleElement(this.tooltip,!1,!1),lt(this.tooltip),this.tooltip=null);},async _show(){this.tooltip=L(this.container,`<div id="${this.id}" class="uk-${this.$options.name}" role="tooltip"> <div class="uk-${this.$options.name}-inner">${this.title}</div> </div>`),x(this.tooltip,"toggled",(t,e)=>{if(!e)return;const i=()=>this.positionAt(this.tooltip,this.$el);i();const[s,n]=rl(this.tooltip,this.$el,this.pos);this.origin=this.axis==="y"?`${ri(s)}-${n}`:`${n}-${ri(s)}`;const o=[j(document,`keydown ${mt}`,this.hide,!1,r=>r.type===mt&&!B(r.target,this.$el)||r.type==="keydown"&&r.keyCode===I.ESC),x([document,...jt(this.$el)],"scroll",i,{passive:!0})];j(this.tooltip,"hide",()=>o.forEach(r=>r()),{self:!0});}),await this.toggleElement(this.tooltip,!0)||this.hide();}},events:{focus:"show",blur:"hide",[`${Rt} ${Oe}`](t){St(t)||this[t.type===Rt?"show":"hide"]();},[mt](t){St(t)&&this.show();}}};function ol(t){ti(t)||p(t,"tabindex","0");}function rl(t,e,[i,s]){const n=A(t),o=A(e),r=[["left","right"],["top","bottom"]];for(const l of r){if(n[l[0]]>=o[l[1]]){i=l[1];break}if(n[l[1]]<=o[l[0]]){i=l[0];break}}const a=m(r[0],i)?r[1]:r[0];return n[a[0]]===o[a[0]]?s=a[0]:n[a[1]]===o[a[1]]?s=a[1]:s="center",[i,s]}var al={mixins:[vi],i18n:{invalidMime:"Invalid File Type: %s",invalidName:"Invalid File Name: %s",invalidSize:"Invalid File Size: %s Kilobytes Max"},props:{allow:String,clsDragover:String,concurrent:Number,maxSize:Number,method:String,mime:String,multiple:Boolean,name:String,params:Object,type:String,url:String},data:{allow:!1,clsDragover:"uk-dragover",concurrent:1,maxSize:0,method:"POST",mime:!1,multiple:!1,name:"files[]",params:{},type:"",url:"",abort:S,beforeAll:S,beforeSend:S,complete:S,completeAll:S,error:S,fail:S,load:S,loadEnd:S,loadStart:S,progress:S},events:{change(t){C(t.target,'input[type="file"]')&&(t.preventDefault(),t.target.files&&this.upload(t.target.files),t.target.value="");},drop(t){Ti(t);const e=t.dataTransfer;e!=null&&e.files&&(M(this.$el,this.clsDragover),this.upload(e.files));},dragenter(t){Ti(t);},dragover(t){Ti(t),y(this.$el,this.clsDragover);},dragleave(t){Ti(t),M(this.$el,this.clsDragover);}},methods:{async upload(t){if(t=Qt(t),!t.length)return;v(this.$el,"upload",[t]);for(const s of t){if(this.maxSize&&this.maxSize*1e3<s.size){this.fail(this.t("invalidSize",this.maxSize));return}if(this.allow&&!co(this.allow,s.name)){this.fail(this.t("invalidName",this.allow));return}if(this.mime&&!co(this.mime,s.type)){this.fail(this.t("invalidMime",this.mime));return}}this.multiple||(t=t.slice(0,1)),this.beforeAll(this,t);const e=ll(t,this.concurrent),i=async s=>{const n=new FormData;s.forEach(o=>n.append(this.name,o));for(const o in this.params)n.append(o,this.params[o]);try{const o=await hl(this.url,{data:n,method:this.method,responseType:this.type,beforeSend:r=>{const{xhr:a}=r;x(a.upload,"progress",this.progress);for(const l of ["loadStart","load","loadEnd","abort"])x(a,l.toLowerCase(),this[l]);return this.beforeSend(r)}});this.complete(o),e.length?await i(e.shift()):this.completeAll(o);}catch(o){this.error(o);}};await i(e.shift());}}};function co(t,e){return e.match(new RegExp(`^${t.replace(/\//g,"\\/").replace(/\*\*/g,"(\\/[^\\/]+)*").replace(/\*/g,"[^\\/]+").replace(/((?!\\))\?/g,"$1.")}$`,"i"))}function ll(t,e){const i=[];for(let s=0;s<t.length;s+=e)i.push(t.slice(s,s+e));return i}function Ti(t){t.preventDefault(),t.stopPropagation();}function hl(t,e){const i={data:null,method:"GET",headers:{},xhr:new XMLHttpRequest,beforeSend:S,responseType:"",...e};return Promise.resolve().then(()=>i.beforeSend(i)).then(()=>cl(t,i))}function cl(t,e){return new Promise((i,s)=>{const{xhr:n}=e;for(const o in e)if(o in n)try{n[o]=e[o];}catch{}n.open(e.method.toUpperCase(),t);for(const o in e.headers)n.setRequestHeader(o,e.headers[o]);x(n,"load",()=>{n.status===0||n.status>=200&&n.status<300||n.status===304?i(n):s(wt(Error(n.statusText),{xhr:n,status:n.status}));}),x(n,"error",()=>s(wt(Error("Network Error"),{xhr:n}))),x(n,"timeout",()=>s(wt(Error("Network Timeout"),{xhr:n}))),n.send(e.data);})}var ul=Object.freeze({__proto__:null,Countdown:Sr,Filter:Nr,Lightbox:_a,LightboxPanel:jn,Notification:Oa,Parallax:Wa,Slider:Ua,SliderParallax:no,Slideshow:Xa,SlideshowParallax:no,Sortable:Ja,Tooltip:nl,Upload:al});function fl(t){Lt&&window.MutationObserver&&(document.body?requestAnimationFrame(()=>uo(t)):new MutationObserver((e,i)=>{document.body&&(uo(t),i.disconnect());}).observe(document.documentElement,{childList:!0}));}function uo(t){v(document,"uikit:init",t),document.body&&It(document.body,fo),new MutationObserver(e=>e.forEach(dl)).observe(document,{childList:!0,subtree:!0}),new MutationObserver(e=>e.forEach(pl)).observe(document,{attributes:!0,subtree:!0}),t._initialized=!0;}function dl({addedNodes:t,removedNodes:e}){for(const i of t)It(i,fo);for(const i of e)It(i,gl);}function pl({target:t,attributeName:e}){var i;const s=po(e);if(s){if($t(t,e)){We(s,t);return}(i=bi(t,s))==null||i.$destroy();}}function fo(t){const e=Vt(t);for(const i in Vt(t))bs(e[i]);for(const i of t.getAttributeNames()){const s=po(i);s&&We(s,t);}}function gl(t){const e=Vt(t);for(const i in Vt(t))$s(e[i]);}function po(t){ot(t,"data-")&&(t=t.slice(5));const e=ge[t];return e&&(yt(e)?e:e.options).name}Ca(ft),Ta(ft);var go={mixins:[st,qt],props:{animation:Boolean,targets:String,active:null,collapsible:Boolean,multiple:Boolean,toggle:String,content:String,offset:Number},data:{targets:"> *",active:!1,animation:!0,collapsible:!0,multiple:!1,clsOpen:"uk-open",toggle:"> .uk-accordion-title",content:"> .uk-accordion-content",offset:0},computed:{items({targets:t},e){return z(t,e)},toggles({toggle:t}){return this.items.map(e=>w(t,e))},contents({content:t}){return this.items.map(e=>{var i;return ((i=e._wrapper)==null?void 0:i.firstElementChild)||w(t,e)})}},watch:{items(t,e){if(e||P(t,this.clsOpen))return;const i=this.active!==!1&&t[Number(this.active)]||!this.collapsible&&t[0];i&&this.toggle(i,!1);},toggles(){this.$emit();},contents(t){for(const e of t){const i=P(this.items.find(s=>B(e,s)),this.clsOpen);Ei(e,!i);}this.$emit();}},observe:Ne(),events:[{name:"click keydown",delegate(){return `${this.targets} ${this.$props.toggle}`},async handler(t){var e;t.type==="keydown"&&t.keyCode!==I.SPACE||(t.preventDefault(),(e=this._off)==null||e.call(this),this._off=vl(t.target),await this.toggle(re(this.toggles,t.current)),this._off());}},{name:"shown hidden",self:!0,delegate(){return this.targets},handler(){this.$emit();}}],update(){const t=Ie(this.items,`.${this.clsOpen}`);for(const e in this.items){const i=this.toggles[e],s=this.contents[e];if(!i||!s)continue;i.id=At(this,i,`-title-${e}`),s.id=At(this,s,`-content-${e}`);const n=m(t,this.items[e]);p(i,{role:G(i,"a")?"button":null,"aria-controls":s.id,"aria-expanded":n,"aria-disabled":!this.collapsible&&t.length<2&&n}),p(s,{role:"region","aria-labelledby":i.id}),G(s,"ul")&&p(T(s),"role","presentation");}},methods:{toggle(t,e){t=this.items[rt(t,this.items)];let i=[t];const s=Ie(this.items,`.${this.clsOpen}`);if(!this.multiple&&!m(s,i[0])&&(i=i.concat(s)),!(!this.collapsible&&s.length<2&&m(s,t)))return Promise.all(i.map(n=>this.toggleElement(n,!m(s,n),(o,r)=>{if(q(o,this.clsOpen,r),e===!1||!this.animation){Ei(w(this.content,o),!r);return}return ml(o,r,this)})))}}};function Ei(t,e){t&&(t.hidden=e);}async function ml(t,e,{content:i,duration:s,velocity:n,transition:o}){var r;i=((r=t._wrapper)==null?void 0:r.firstElementChild)||w(i,t),t._wrapper||(t._wrapper=oi(i,"<div>"));const a=t._wrapper;c(a,"overflow","hidden");const l=$(c(a,"height"));await E.cancel(a),Ei(i,!1);const h=Dt(["marginTop","marginBottom"],f=>c(i,f))+b(i).height,u=l/h;s=(n*h+s)*(e?1-u:u),c(a,"height",l),await E.start(a,{height:e?h:0},s,o),Pe(i),delete t._wrapper,e||Ei(i,!0);}function vl(t){const e=Ct(t,!0);let i;return function s(){i=requestAnimationFrame(()=>{const{top:n}=t.getBoundingClientRect();n<0&&(e.scrollTop+=n),s();});}(),()=>requestAnimationFrame(()=>cancelAnimationFrame(i))}var wl={mixins:[st,qt],args:"animation",props:{animation:Boolean,close:String},data:{animation:!0,selClose:".uk-alert-close",duration:150},events:{name:"click",delegate(){return this.selClose},handler(t){t.preventDefault(),this.close();}},methods:{async close(){await this.toggleElement(this.$el,!1,bl),this.$destroy(!0);}}};function bl(t,e,{duration:i,transition:s,velocity:n}){const o=$(c(t,"height"));return c(t,"height",o),E.start(t,{height:0,marginTop:0,marginBottom:0,paddingTop:0,paddingBottom:0,borderTop:0,borderBottom:0,opacity:0},n*o+i,s)}var mo={args:"autoplay",props:{automute:Boolean,autoplay:Boolean},data:{automute:!1,autoplay:!0},connected(){this.inView=this.autoplay==="inview",this.inView&&!$t(this.$el,"preload")&&(this.$el.preload="none"),G(this.$el,"iframe")&&!$t(this.$el,"allow")&&(this.$el.allow="autoplay"),this.automute&&Gs(this.$el);},observe:[Me({args:{intersecting:!1}}),pt()],update:{read({visible:t}){return Xs(this.$el)?{prev:t,visible:R(this.$el),inView:this.inView&&ns(this.$el)}:!1},write({prev:t,visible:e,inView:i}){!e||this.inView&&!i?Ys(this.$el):(this.autoplay===!0&&!t||i)&&Vs(this.$el);},events:["resize"]}},$l={mixins:[mo],props:{width:Number,height:Number},data:{automute:!0},events:{"load loadedmetadata"(){this.$emit("resize");}},observe:pt({target:({$el:t})=>[vo(t)||_(t)]}),update:{read(){const{ratio:t,cover:e}=Qe,{$el:i,width:s,height:n}=this;let o={width:s,height:n};if(!s||!n){const h={width:i.naturalWidth||i.videoWidth||i.clientWidth,height:i.naturalHeight||i.videoHeight||i.clientHeight};s?o=t(h,"width",s):n?o=t(h,"height",n):o=h;}const{offsetHeight:r,offsetWidth:a}=vo(i)||_(i),l=e(o,{width:a+(a%2?1:0),height:r+(r%2?1:0)});return !l.width||!l.height?!1:l},write({height:t,width:e}){c(this.$el,{height:t,width:e});},events:["resize"]}};function vo(t){for(;t=_(t);)if(c(t,"position")!=="static")return t}let K;var wo={mixins:[Fe,ho,qt],args:"pos",props:{mode:"list",toggle:Boolean,boundary:Boolean,boundaryX:Boolean,boundaryY:Boolean,target:Boolean,targetX:Boolean,targetY:Boolean,stretch:Boolean,delayShow:Number,delayHide:Number,autoUpdate:Boolean,clsDrop:String,animateOut:Boolean,bgScroll:Boolean},data:{mode:["click","hover"],toggle:"- *",boundary:!1,boundaryX:!1,boundaryY:!1,target:!1,targetX:!1,targetY:!1,stretch:!1,delayShow:0,delayHide:800,autoUpdate:!0,clsDrop:!1,animateOut:!1,bgScroll:!0,animation:["uk-animation-fade"],cls:"uk-open",container:!1},computed:{boundary({boundary:t,boundaryX:e,boundaryY:i},s){return [at(e||t,s)||window,at(i||t,s)||window]},target({target:t,targetX:e,targetY:i},s){return e||(e=t||this.targetEl),i||(i=t||this.targetEl),[e===!0?window:at(e,s),i===!0?window:at(i,s)]}},created(){this.tracker=new ts;},beforeConnect(){this.clsDrop=this.$props.clsDrop||`uk-${this.$options.name}`;},connected(){y(this.$el,"uk-drop",this.clsDrop),this.toggle&&!this.targetEl&&(this.targetEl=kl(this)),this._style=Ni(this.$el.style,["width","height"]);},disconnected(){this.isActive()&&(this.hide(!1),K=null),c(this.$el,this._style);},observe:Ne({target:({toggle:t,$el:e})=>at(t,e),targets:({$el:t})=>t}),events:[{name:"click",delegate(){return ".uk-drop-close"},handler(t){t.preventDefault(),this.hide(!1);}},{name:"click",delegate(){return 'a[href*="#"]'},handler({defaultPrevented:t,current:e}){const{hash:i}=e;!t&&i&&ae(e)&&!B(i,this.$el)&&this.hide(!1);}},{name:"beforescroll",handler(){this.hide(!1);}},{name:"toggle",self:!0,handler(t,e){t.preventDefault(),this.isToggled()?this.hide(!1):this.show(e==null?void 0:e.$el,!1);}},{name:"toggleshow",self:!0,handler(t,e){t.preventDefault(),this.show(e==null?void 0:e.$el);}},{name:"togglehide",self:!0,handler(t){t.preventDefault(),C(this.$el,":focus,:hover")||this.hide();}},{name:`${Rt} focusin`,filter(){return m(this.mode,"hover")},handler(t){St(t)||this.clearTimers();}},{name:`${Oe} focusout`,filter(){return m(this.mode,"hover")},handler(t){!St(t)&&t.relatedTarget&&this.hide();}},{name:"toggled",self:!0,handler(t,e){p(this.targetEl,"aria-expanded",e?!0:null),e&&(this.clearTimers(),this.position());}},{name:"show",self:!0,handler(){K=this,this.tracker.init();const t=[Sl(this),Cl(this),Tl(this),this.autoUpdate&&Il(this),!this.bgScroll&&In(this.$el)];j(this.$el,"hide",()=>t.forEach(e=>e&&e()),{self:!0});}},{name:"beforehide",self:!0,handler(){this.clearTimers();}},{name:"hide",handler({target:t}){if(this.$el!==t){K=K===null&&B(t,this.$el)&&this.isToggled()?this:K;return}K=this.isActive()?null:K,this.tracker.cancel();}}],update:{write(){this.isToggled()&&!P(this.$el,this.clsEnter)&&this.position();}},methods:{show(t=this.targetEl,e=!0){if(this.isToggled()&&t&&this.targetEl&&t!==this.targetEl&&this.hide(!1,!1),this.targetEl=t,this.clearTimers(),!this.isActive()){if(K){if(e&&K.isDelaying){this.showTimer=setTimeout(()=>C(t,":hover")&&this.show(),10);return}let i;for(;K&&i!==K&&!B(this.$el,K.$el);)i=K,K.hide(!1,!1);}this.container&&_(this.$el)!==this.container&&L(this.container,this.$el),this.showTimer=setTimeout(()=>this.toggleElement(this.$el,!0),e&&this.delayShow||0);}},hide(t=!0,e=!0){const i=()=>this.toggleElement(this.$el,!1,this.animateOut&&e);this.clearTimers(),this.isDelaying=xl(this.$el).some(s=>this.tracker.movesTo(s)),t&&this.isDelaying?this.hideTimer=setTimeout(this.hide,50):t&&this.delayHide?this.hideTimer=setTimeout(i,this.delayHide):i();},clearTimers(){clearTimeout(this.showTimer),clearTimeout(this.hideTimer),this.showTimer=null,this.hideTimer=null,this.isDelaying=!1;},isActive(){return K===this},position(){M(this.$el,"uk-drop-stack"),c(this.$el,this._style),this.$el.hidden=!0;const t=this.target.map(n=>yl(this.$el,n)),e=this.getViewportOffset(this.$el),i=[[0,["x","width","left","right"]],[1,["y","height","top","bottom"]]];for(const[n,[o,r]]of i)this.axis!==o&&m([o,!0],this.stretch)&&c(this.$el,{[r]:Math.min(A(this.boundary[n])[r],t[n][r]-2*e),[`overflow-${o}`]:"auto"});const s=t[0].width-2*e;this.$el.hidden=!1,c(this.$el,"maxWidth",""),this.$el.offsetWidth>s&&y(this.$el,"uk-drop-stack"),c(this.$el,"maxWidth",s),this.positionAt(this.$el,this.target,this.boundary);for(const[n,[o,r,a,l]]of i)if(this.axis===o&&m([o,!0],this.stretch)){const h=Math.abs(this.getPositionOffset(this.$el)),u=A(this.target[n]),f=A(this.$el);c(this.$el,{[r]:(u[a]>f[a]?u[this.inset?l:a]-Math.max(A(this.boundary[n])[a],t[n][a]+e):Math.min(A(this.boundary[n])[l],t[n][l]-e)-u[this.inset?a:l])-h,[`overflow-${o}`]:"auto"}),this.positionAt(this.$el,this.target,this.boundary);}}}};function xl(t){const e=[];return It(t,i=>c(i,"position")!=="static"&&e.push(i)),e}function yl(t,e){return ct(jt(e).find(i=>B(t,i)))}function kl(t){const{$el:e}=t.$create("toggle",at(t.toggle,t.$el),{target:t.$el,mode:t.mode});return p(e,"aria-haspopup",!0),e}function Sl(t){const e=()=>t.$emit(),i=[es(e),hi(jt(t.$el).concat(t.target),e)];return ()=>i.map(s=>s.disconnect())}function Il(t){return x([document,...jt(t.$el)],"scroll",()=>t.$emit(),{passive:!0})}function Cl(t){return x(document,"keydown",e=>{e.keyCode===I.ESC&&t.hide(!1);})}function Tl(t){return x(document,mt,({target:e})=>{B(e,t.$el)||j(document,`${_t} ${li} scroll`,({defaultPrevented:i,type:s,target:n})=>{!i&&s===_t&&e===n&&!(t.targetEl&&B(e,t.targetEl))&&t.hide(!1);},!0);})}var bo={mixins:[st,Fe],props:{align:String,clsDrop:String,boundary:Boolean,dropbar:Boolean,dropbarAnchor:Boolean,duration:Number,mode:Boolean,offset:Boolean,stretch:Boolean,delayShow:Boolean,delayHide:Boolean,target:Boolean,targetX:Boolean,targetY:Boolean,animation:Boolean,animateOut:Boolean},data:{align:X?"right":"left",clsDrop:"uk-dropdown",clsDropbar:"uk-dropnav-dropbar",boundary:!0,dropbar:!1,dropbarAnchor:!1,duration:200,container:!1,selNavItem:"> li > a, > ul > li > a"},computed:{dropbarAnchor({dropbarAnchor:t},e){return at(t,e)||e},dropbar({dropbar:t}){return t?(t=this._dropbar||at(t,this.$el)||w(`+ .${this.clsDropbar}`,this.$el),t||(this._dropbar=w("<div></div>"))):null},dropContainer(t,e){return this.container||e},dropdowns({clsDrop:t},e){var i;const s=z(`.${t}`,e);if(this.dropContainer!==e)for(const n of z(`.${t}`,this.dropContainer)){const o=(i=this.getDropdown(n))==null?void 0:i.targetEl;!m(s,n)&&o&&B(o,this.$el)&&s.push(n);}return s},items({selNavItem:t},e){return z(t,e)}},watch:{dropbar(t){y(t,"uk-dropbar","uk-dropbar-top",this.clsDropbar,`uk-${this.$options.name}-dropbar`);},dropdowns(){this.initializeDropdowns();}},connected(){this.initializeDropdowns();},disconnected(){lt(this._dropbar),delete this._dropbar;},events:[{name:"mouseover focusin",delegate(){return this.selNavItem},handler({current:t}){const e=this.getActive();e&&m(e.mode,"hover")&&e.targetEl&&!B(e.targetEl,t)&&!e.isDelaying&&e.hide(!1);}},{name:"keydown",self:!0,delegate(){return this.selNavItem},handler(t){var e;const{current:i,keyCode:s}=t,n=this.getActive();s===I.DOWN&&(n==null?void 0:n.targetEl)===i&&(t.preventDefault(),(e=w(Se,n.$el))==null||e.focus()),$o(t,this.items,n);}},{name:"keydown",el(){return this.dropContainer},delegate(){return `.${this.clsDrop}`},handler(t){var e;const{current:i,keyCode:s}=t;if(!m(this.dropdowns,i))return;const n=this.getActive();let o=-1;if(s===I.HOME?o=0:s===I.END?o="last":s===I.UP?o="previous":s===I.DOWN?o="next":s===I.ESC&&((e=n.targetEl)==null||e.focus()),~o){t.preventDefault();const r=z(Se,i);r[rt(o,r,xt(r,a=>C(a,":focus")))].focus();}$o(t,this.items,n);}},{name:"mouseleave",el(){return this.dropbar},filter(){return this.dropbar},handler(){const t=this.getActive();t&&m(t.mode,"hover")&&!this.dropdowns.some(e=>C(e,":hover"))&&t.hide();}},{name:"beforeshow",el(){return this.dropContainer},filter(){return this.dropbar},handler({target:t}){this.isDropbarDrop(t)&&(this.dropbar.previousElementSibling!==this.dropbarAnchor&&si(this.dropbarAnchor,this.dropbar),y(t,`${this.clsDrop}-dropbar`));}},{name:"show",el(){return this.dropContainer},filter(){return this.dropbar},handler({target:t}){if(!this.isDropbarDrop(t))return;const e=this.getDropdown(t),i=()=>{const s=oe(t,`.${this.clsDrop}`).concat(t).map(a=>A(a)),n=Math.min(...s.map(({top:a})=>a)),o=Math.max(...s.map(({bottom:a})=>a)),r=A(this.dropbar);c(this.dropbar,"top",this.dropbar.offsetTop-(r.top-n)),this.transitionTo(o-n+$(c(t,"marginBottom")),t);};this._observer=hi([e.$el,...e.target],i),i();}},{name:"beforehide",el(){return this.dropContainer},filter(){return this.dropbar},handler(t){const e=this.getActive();C(this.dropbar,":hover")&&e.$el===t.target&&!this.items.some(i=>e.targetEl!==i&&C(i,":focus"))&&t.preventDefault();}},{name:"hide",el(){return this.dropContainer},filter(){return this.dropbar},handler({target:t}){var e;if(!this.isDropbarDrop(t))return;(e=this._observer)==null||e.disconnect();const i=this.getActive();(!i||i.$el===t)&&this.transitionTo(0);}}],methods:{getActive(){var t;return m(this.dropdowns,(t=K)==null?void 0:t.$el)&&K},async transitionTo(t,e){const{dropbar:i}=this,s=et(i);e=s<t&&e,await E.cancel([e,i]),c(e,"clipPath",`polygon(0 0,100% 0,100% ${s}px,0 ${s}px)`),et(i,s),await Promise.all([E.start(i,{height:t},this.duration),E.start(e,{clipPath:`polygon(0 0,100% 0,100% ${t}px,0 ${t}px)`},this.duration).finally(()=>c(e,{clipPath:""}))]).catch(S);},getDropdown(t){return this.$getComponent(t,"drop")||this.$getComponent(t,"dropdown")},isDropbarDrop(t){return this.getDropdown(t)&&P(t,this.clsDrop)},initializeDropdowns(){this.$create("drop",this.dropdowns.filter(t=>!this.getDropdown(t)),{...this.$props,flip:!1,shift:!0,pos:`bottom-${this.align}`,boundary:this.boundary===!0?this.$el:this.boundary});}}};function $o(t,e,i){var s,n,o;const{current:r,keyCode:a}=t;let l=-1;a===I.HOME?l=0:a===I.END?l="last":a===I.LEFT?l="previous":a===I.RIGHT?l="next":a===I.TAB&&((s=i.targetEl)==null||s.focus(),(n=i.hide)==null||n.call(i,!1)),~l&&(t.preventDefault(),(o=i.hide)==null||o.call(i,!1),e[rt(l,e,e.indexOf(i.targetEl||r))].focus());}var El={mixins:[st],args:"target",props:{target:Boolean},data:{target:!1},computed:{input(t,e){return w(ke,e)},state(){return this.input.nextElementSibling},target({target:t},e){return t&&(t===!0&&_(this.input)===e&&this.input.nextElementSibling||w(t,e))}},update(){var t;const{target:e,input:i}=this;if(!e)return;let s;const n=ji(e)?"value":"textContent",o=e[n],r=(t=i.files)!=null&&t[0]?i.files[0].name:C(i,"select")&&(s=z("option",i).filter(a=>a.selected)[0])?s.textContent:i.value;o!==r&&(e[n]=r);},events:[{name:"change",handler(){this.$emit();}},{name:"reset",el(){return U(this.$el,"form")},handler(){this.$emit();}}]},Pl={extends:pn,mixins:[st],name:"grid",props:{masonry:Boolean,parallax:Number},data:{margin:"uk-grid-margin",clsStack:"uk-grid-stack",masonry:!1,parallax:0},connected(){this.masonry&&y(this.$el,"uk-flex-top uk-flex-wrap-top");},observe:di({filter:({parallax:t})=>t}),update:[{write({columns:t}){q(this.$el,this.clsStack,t.length<2);},events:["resize"]},{read(t){let{columns:e,rows:i}=t;if(!e.length||!this.masonry&&!this.parallax||xo(this.$el))return t.translates=!1,!1;let s=!1;const n=T(this.$el),o=e.map(h=>Dt(h,"offsetHeight")),r=Al(n,this.margin)*(i.length-1),a=Math.max(...o)+r;this.masonry&&(e=e.map(h=>Ke(h,"offsetTop")),s=_l(i,e));let l=Math.abs(this.parallax);return l&&(l=o.reduce((h,u,f)=>Math.max(h,u+r+(f%2?l:l/8)-a),0)),{padding:l,columns:e,translates:s,height:s?a:""}},write({height:t,padding:e}){c(this.$el,"paddingBottom",e||""),t!==!1&&c(this.$el,"height",t);},events:["resize"]},{read(){return this.parallax&&xo(this.$el)?!1:{scrolled:this.parallax?os(this.$el)*Math.abs(this.parallax):!1}},write({columns:t,scrolled:e,translates:i}){e===!1&&!i||t.forEach((s,n)=>s.forEach((o,r)=>c(o,"transform",!e&&!i?"":`translateY(${(i&&-i[n][r])+(e?n%2?e:e/8:0)}px)`)));},events:["scroll","resize"]}]};function xo(t){return T(t).some(e=>c(e,"position")==="absolute")}function _l(t,e){const i=t.map(s=>Math.max(...s.map(n=>n.offsetHeight)));return e.map(s=>{let n=0;return s.map((o,r)=>n+=r?i[r-1]-s[r-1].offsetHeight:0)})}function Al(t,e){const[i]=t.filter(s=>P(s,e));return $(i?c(i,"marginTop"):c(t[0],"paddingLeft"))}var Ol={args:"target",props:{target:String,row:Boolean},data:{target:"> *",row:!0},computed:{elements({target:t},e){return z(t,e)}},observe:pt({target:({$el:t,elements:e})=>[t,...e]}),update:{read(){return {rows:(this.row?hs(this.elements):[this.elements]).map(Dl)}},write({rows:t}){for(const{heights:e,elements:i}of t)i.forEach((s,n)=>c(s,"minHeight",e[n]));},events:["resize"]}};function Dl(t){if(t.length<2)return {heights:[""],elements:t};let e=t.map(Bl);const i=Math.max(...e);return {heights:t.map((s,n)=>e[n].toFixed(2)===i.toFixed(2)?"":i),elements:t}}function Bl(t){const e=Ni(t.style,["display","minHeight"]);R(t)||c(t,"display","block","important"),c(t,"minHeight","");const i=b(t).height-he(t,"height","content-box");return c(t,e),i}var Ml={props:{expand:Boolean,offsetTop:Boolean,offsetBottom:Boolean,minHeight:Number},data:{expand:!1,offsetTop:!1,offsetBottom:!1,minHeight:0},observe:pt({target:({$el:t})=>[t,...fe(t)]}),update:{read(){if(!R(this.$el))return !1;let t="";const e=he(this.$el,"height","content-box"),{body:i,scrollingElement:s}=document,n=Ct(this.$el),{height:o}=ct(n===i?s:n);if(this.expand)t=`${o-(b(n).height-b(this.$el).height)-e}px`;else {const r=s===n||i===n;if(t=`calc(${r?"100vh":`${o}px`}`,this.offsetTop)if(r){const a=Ht(this.$el)[0]-Ht(n)[0];t+=a>0&&a<o/2?` - ${a}px`:"";}else t+=` - ${c(n,"paddingTop")}`;this.offsetBottom===!0?t+=` - ${b(this.$el.nextElementSibling).height}px`:bt(this.offsetBottom)?t+=` - ${this.offsetBottom}vh`:this.offsetBottom&&Zt(this.offsetBottom,"px")?t+=` - ${$(this.offsetBottom)}px`:D(this.offsetBottom)&&(t+=` - ${b(at(this.offsetBottom,this.$el)).height}px`),t+=`${e?` - ${e}px`:""})`;}return {minHeight:t}},write({minHeight:t}){c(this.$el,"minHeight",`max(${this.minHeight||0}px, ${t})`);},events:["resize"]}},Nl='<svg width="14" height="14" viewBox="0 0 14 14"><line fill="none" stroke="#000" stroke-width="1.1" x1="1" y1="1" x2="13" y2="13"/><line fill="none" stroke="#000" stroke-width="1.1" x1="13" y1="1" x2="1" y2="13"/></svg>',zl='<svg width="20" height="20" viewBox="0 0 20 20"><line fill="none" stroke="#000" stroke-width="1.4" x1="1" y1="1" x2="19" y2="19"/><line fill="none" stroke="#000" stroke-width="1.4" x1="19" y1="1" x2="1" y2="19"/></svg>',Fl='<svg width="12" height="12" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" stroke-width="1.1" points="1 3.5 6 8.5 11 3.5"/></svg>',Hl='<svg width="20" height="20" viewBox="0 0 20 20"><rect x="9" y="4" width="1" height="11"/><rect x="4" y="9" width="11" height="1"/></svg>',Ll='<svg width="14" height="14" viewBox="0 0 14 14"><polyline fill="none" stroke="#000" stroke-width="1.1" points="1 4 7 10 13 4"/></svg>',Wl='<svg width="12" height="12" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" stroke-width="1.1" points="1 3.5 6 8.5 11 3.5"/></svg>',Rl='<svg width="12" height="12" viewBox="0 0 12 12"><polyline fill="none" stroke="#000" stroke-width="1.1" points="1 3.5 6 8.5 11 3.5"/></svg>',jl='<svg width="20" height="20" viewBox="0 0 20 20"><style>.uk-navbar-toggle-animate svg&gt;[class*=&quot;line-&quot;]{transition:0.2s ease-in-out;transition-property:transform, opacity;transform-origin:center;opacity:1}.uk-navbar-toggle svg&gt;.line-3{opacity:0}.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-3{opacity:1}.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-2{transform:rotate(45deg)}.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-3{transform:rotate(-45deg)}.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-1,.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-4{opacity:0}.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-1{transform:translateY(6px) scaleX(0)}.uk-navbar-toggle-animate[aria-expanded=&quot;true&quot;] svg&gt;.line-4{transform:translateY(-6px) scaleX(0)}</style><rect class="line-1" y="3" width="20" height="2"/><rect class="line-2" y="9" width="20" height="2"/><rect class="line-3" y="9" width="20" height="2"/><rect class="line-4" y="15" width="20" height="2"/></svg>',ql='<svg width="40" height="40" viewBox="0 0 40 40"><rect x="19" y="0" width="1" height="40"/><rect x="0" y="19" width="40" height="1"/></svg>',Ul='<svg width="7" height="12" viewBox="0 0 7 12"><polyline fill="none" stroke="#000" stroke-width="1.2" points="1 1 6 6 1 11"/></svg>',Vl='<svg width="7" height="12" viewBox="0 0 7 12"><polyline fill="none" stroke="#000" stroke-width="1.2" points="6 1 1 6 6 11"/></svg>',Yl='<svg width="20" height="20" viewBox="0 0 20 20"><circle fill="none" stroke="#000" stroke-width="1.1" cx="9" cy="9" r="7"/><path fill="none" stroke="#000" stroke-width="1.1" d="M14,14 L18,18 L14,14 Z"/></svg>',Gl='<svg width="40" height="40" viewBox="0 0 40 40"><circle fill="none" stroke="#000" stroke-width="1.8" cx="17.5" cy="17.5" r="16.5"/><line fill="none" stroke="#000" stroke-width="1.8" x1="38" y1="39" x2="29" y2="30"/></svg>',Xl='<svg width="24" height="24" viewBox="0 0 24 24"><circle fill="none" stroke="#000" stroke-width="1.1" cx="10.5" cy="10.5" r="9.5"/><line fill="none" stroke="#000" stroke-width="1.1" x1="23" y1="23" x2="17" y2="17"/></svg>',Jl='<svg width="25" height="40" viewBox="0 0 25 40"><polyline fill="none" stroke="#000" stroke-width="2" points="4.002,38.547 22.527,20.024 4,1.5"/></svg>',Kl='<svg width="14" height="24" viewBox="0 0 14 24"><polyline fill="none" stroke="#000" stroke-width="1.4" points="1.225,23 12.775,12 1.225,1"/></svg>',Zl='<svg width="25" height="40" viewBox="0 0 25 40"><polyline fill="none" stroke="#000" stroke-width="2" points="20.527,1.5 2,20.024 20.525,38.547"/></svg>',Ql='<svg width="14" height="24" viewBox="0 0 14 24"><polyline fill="none" stroke="#000" stroke-width="1.4" points="12.775,1 1.225,12 12.775,23"/></svg>',th='<svg width="30" height="30" viewBox="0 0 30 30"><circle fill="none" stroke="#000" cx="15" cy="15" r="14"/></svg>',eh='<svg width="18" height="10" viewBox="0 0 18 10"><polyline fill="none" stroke="#000" stroke-width="1.2" points="1 9 9 1 17 9"/></svg>',yo={args:"src",props:{width:Number,height:Number,ratio:Number},data:{ratio:1},connected(){this.svg=this.getSvg().then(t=>{if(!this._connected)return;const e=ih(t,this.$el);return this.svgEl&&e!==this.svgEl&&lt(this.svgEl),sh.call(this,e,t),this.svgEl=e},S);},disconnected(){this.svg.then(t=>{this._connected||(Ri(this.$el)&&(this.$el.hidden=!1),lt(t),this.svgEl=null);}),this.svg=null;},methods:{async getSvg(){}}};function ih(t,e){if(Ri(e)||G(e,"canvas")){e.hidden=!0;const s=e.nextElementSibling;return ko(t,s)?s:si(e,t)}const i=e.lastElementChild;return ko(t,i)?i:L(e,t)}function ko(t,e){return G(t,"svg")&&G(e,"svg")&&t.innerHTML===e.innerHTML}function sh(t,e){const i=["width","height"];let s=i.map(o=>this[o]);s.some(o=>o)||(s=i.map(o=>p(e,o)));const n=p(e,"viewBox");n&&!s.some(o=>o)&&(s=n.split(" ").slice(2)),s.forEach((o,r)=>p(t,i[r],$(o)*this.ratio||null));}const Pi={spinner:th,totop:eh,marker:Hl,"close-icon":Nl,"close-large":zl,"drop-parent-icon":Fl,"nav-parent-icon":Wl,"nav-parent-icon-large":Ll,"navbar-parent-icon":Rl,"navbar-toggle-icon":jl,"overlay-icon":ql,"pagination-next":Ul,"pagination-previous":Vl,"search-icon":Yl,"search-large":Gl,"search-navbar":Xl,"slidenav-next":Kl,"slidenav-next-large":Jl,"slidenav-previous":Ql,"slidenav-previous-large":Zl},Ss={install:dh,mixins:[yo],args:"icon",props:{icon:String},isIcon:!0,beforeConnect(){y(this.$el,"uk-icon");},methods:{async getSvg(){const t=ph(this.icon);if(!t)throw "Icon not found.";return t}}},Gt={args:!1,extends:Ss,data:t=>({icon:Kt(t.constructor.options.name)}),beforeConnect(){y(this.$el,this.$options.id);}},nh={extends:Gt,beforeConnect(){const t=this.$props.icon;this.icon=U(this.$el,".uk-nav-primary")?`${t}-large`:t;}},oh={extends:Gt,mixins:[vi],i18n:{toggle:"Open Search",submit:"Submit Search"},beforeConnect(){if(this.icon=P(this.$el,"uk-search-icon")&&oe(this.$el,".uk-search-large").length?"search-large":oe(this.$el,".uk-search-navbar").length?"search-navbar":this.$props.icon,!$t(this.$el,"aria-label"))if(P(this.$el,"uk-search-toggle")||P(this.$el,"uk-navbar-toggle")){const t=this.t("toggle");p(this.$el,"aria-label",t);}else {const t=U(this.$el,"a,button");if(t){const e=this.t("submit");p(t,"aria-label",e);}}}},rh={extends:Gt,beforeConnect(){p(this.$el,"role","status");},methods:{async getSvg(){const t=await Ss.methods.getSvg.call(this);return this.ratio!==1&&c(w("circle",t),"strokeWidth",1/this.ratio),t}}},Xt={extends:Gt,mixins:[vi],beforeConnect(){const t=U(this.$el,"a,button");p(t,"role",this.role!==null&&G(t,"a")?"button":this.role);const e=this.t("label");e&&!$t(t,"aria-label")&&p(t,"aria-label",e);}},So={extends:Xt,beforeConnect(){y(this.$el,"uk-slidenav");const t=this.$props.icon;this.icon=P(this.$el,"uk-slidenav-large")?`${t}-large`:t;}},ah={extends:Xt,i18n:{label:"Open menu"}},lh={extends:Xt,i18n:{label:"Close"},beforeConnect(){this.icon=`close-${P(this.$el,"uk-close-large")?"large":"icon"}`;}},hh={extends:Xt,i18n:{label:"Open"}},ch={extends:Xt,i18n:{label:"Back to top"}},uh={extends:Xt,i18n:{label:"Next page"},data:{role:null}},fh={extends:Xt,i18n:{label:"Previous page"},data:{role:null}},_i={};function dh(t){t.icon.add=(e,i)=>{const s=D(e)?{[e]:i}:e;Pt(s,(n,o)=>{Pi[o]=n,delete _i[o];}),t._initialized&&It(document.body,n=>Pt(t.getComponents(n),o=>{o.$options.isIcon&&o.icon in s&&o.$reset();}));};}function ph(t){return Pi[t]?(_i[t]||(_i[t]=w((Pi[gh(t)]||Pi[t]).trim())),_i[t].cloneNode(!0)):null}function gh(t){return X?Mi(Mi(t,"left","right"),"previous","next"):t}const mh=Lt&&"loading"in HTMLImageElement.prototype;var vh={args:"dataSrc",props:{dataSrc:String,sources:String,margin:String,target:String,loading:String},data:{dataSrc:"",sources:!1,margin:"50%",target:!1,loading:"lazy"},connected(){if(this.loading!=="lazy"){this.load();return}mh&&Ai(this.$el)&&(this.$el.loading="lazy",Is(this.$el)),yh(this.$el);},disconnected(){this.img&&(this.img.onload=""),delete this.img;},observe:Me({target:({$el:t,$props:e})=>[t,...Ce(e.target,t)],handler(t,e){this.load(),e.disconnect();},options:({margin:t})=>({rootMargin:t}),filter:({loading:t})=>t==="lazy"}),methods:{load(){if(this.img)return this.img;const t=Ai(this.$el)?this.$el:bh(this.$el,this.dataSrc,this.sources);return ye(t,"loading"),Is(this.$el,t.currentSrc),this.img=t}}};function Is(t,e){if(Ai(t)){const i=_(t);(G(i,"picture")?T(i):[t]).forEach(n=>Io(n,n));}else e&&!m(t.style.backgroundImage,e)&&(c(t,"backgroundImage",`url(${Vi(e)})`),v(t,Mt("load",!1)));}const wh=["data-src","data-srcset","sizes"];function Io(t,e){for(const i of wh){const s=tt(t,i);s&&p(e,i.replace(/^(data-)+/,""),s);}}function bh(t,e,i){const s=new Image;return $h(s,i),Io(t,s),s.onload=()=>{Is(t,s.currentSrc);},p(s,"src",e),s}function $h(t,e){if(e=xh(e),e.length){const i=zt("<picture>");for(const s of e){const n=zt("<source>");p(n,s),L(i,n);}L(i,t);}}function xh(t){if(!t)return [];if(ot(t,"["))try{t=JSON.parse(t);}catch{t=[];}else t=Be(t);return Q(t)||(t=[t]),t.filter(e=>!xe(e))}function yh(t){Ai(t)&&!$t(t,"src")&&p(t,"src",'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"></svg>');}function Ai(t){return G(t,"img")}var kh={mixins:[st,$i],props:{fill:String},data:{fill:"",clsWrapper:"uk-leader-fill",clsHide:"uk-leader-hide",attrFill:"data-fill"},computed:{fill({fill:t}){return t||c(this.$el,"--uk-leader-fill-content")}},connected(){[this.wrapper]=Ji(this.$el,`<span class="${this.clsWrapper}">`);},disconnected(){Pe(this.wrapper.childNodes);},observe:pt(),update:{read(){return {width:Math.trunc(this.$el.offsetWidth/2),fill:this.fill,hide:!this.matchMedia}},write({width:t,fill:e,hide:i}){q(this.wrapper,this.clsHide,i),p(this.wrapper,this.attrFill,new Array(t).join(e));},events:["resize"]}},Sh={install:Ih,mixins:[ds],data:{clsPage:"uk-modal-page",selPanel:".uk-modal-dialog",selClose:".uk-modal-close, .uk-modal-close-default, .uk-modal-close-outside, .uk-modal-close-full"},events:[{name:"show",self:!0,handler(){P(this.panel,"uk-margin-auto-vertical")?y(this.$el,"uk-flex"):c(this.$el,"display","block"),et(this.$el);}},{name:"hidden",self:!0,handler(){c(this.$el,"display",""),M(this.$el,"uk-flex");}}]};function Ih({modal:t}){t.dialog=function(i,s){const n=t(`<div class="uk-modal"> <div class="uk-modal-dialog">${i}</div> </div>`,{stack:!0,role:"alertdialog",...s});return n.show(),x(n.$el,"hidden",async()=>{await Promise.resolve(),n.$destroy(!0);},{self:!0}),n},t.alert=function(i,s){return e(({i18n:n})=>`<div class="uk-modal-body">${D(i)?i:Nt(i)}</div> <div class="uk-modal-footer uk-text-right"> <button class="uk-button uk-button-primary uk-modal-close" autofocus>${n.ok}</button> </div>`,s)},t.confirm=function(i,s){return e(({i18n:n})=>`<form> <div class="uk-modal-body">${D(i)?i:Nt(i)}</div> <div class="uk-modal-footer uk-text-right"> <button class="uk-button uk-button-default uk-modal-close" type="button">${n.cancel}</button> <button class="uk-button uk-button-primary" autofocus>${n.ok}</button> </div> </form>`,s,()=>Promise.reject())},t.prompt=function(i,s,n){const o=e(({i18n:l})=>`<form class="uk-form-stacked"> <div class="uk-modal-body"> <label>${D(i)?i:Nt(i)}</label> <input class="uk-input" value="${s||""}" autofocus> </div> <div class="uk-modal-footer uk-text-right"> <button class="uk-button uk-button-default uk-modal-close" type="button">${l.cancel}</button> <button class="uk-button uk-button-primary">${l.ok}</button> </div> </form>`,n,()=>null,()=>a.value),{$el:r}=o.dialog,a=w("input",r);return x(r,"show",()=>a.select()),o},t.i18n={ok:"Ok",cancel:"Cancel"};function e(i,s,n=S,o=S){s={bgClose:!1,escClose:!0,...s,i18n:{...t.i18n,...s==null?void 0:s.i18n}};const r=t.dialog(i(s),s);return wt(new Promise(a=>{const l=x(r.$el,"hide",()=>a(n()));x(r.$el,"submit","form",h=>{h.preventDefault(),a(o(r)),l(),r.hide();});}),{dialog:r})}}var Ch={extends:go,data:{targets:"> .uk-parent",toggle:"> a",content:"> ul"}},Th={extends:bo,data:{clsDrop:"uk-navbar-dropdown",selNavItem:".uk-navbar-nav > li > a,a.uk-navbar-item,button.uk-navbar-item,.uk-navbar-item a,.uk-navbar-item button,.uk-navbar-toggle"},watch:{items(){const t=P(this.$el,"uk-navbar-justify");for(const e of z(".uk-navbar-nav, .uk-navbar-left, .uk-navbar-right",this.$el))c(e,"flexGrow",t?z(".uk-navbar-nav > li > a, .uk-navbar-item, .uk-navbar-toggle",e).length:"");}}},Eh={mixins:[ds],args:"mode",props:{mode:String,flip:Boolean,overlay:Boolean,swiping:Boolean},data:{mode:"slide",flip:!1,overlay:!1,clsPage:"uk-offcanvas-page",clsContainer:"uk-offcanvas-container",selPanel:".uk-offcanvas-bar",clsFlip:"uk-offcanvas-flip",clsContainerAnimation:"uk-offcanvas-container-animation",clsSidebarAnimation:"uk-offcanvas-bar-animation",clsMode:"uk-offcanvas",clsOverlay:"uk-offcanvas-overlay",selClose:".uk-offcanvas-close",container:!1,swiping:!0},computed:{clsFlip({flip:t,clsFlip:e}){return t?e:""},clsOverlay({overlay:t,clsOverlay:e}){return t?e:""},clsMode({mode:t,clsMode:e}){return `${e}-${t}`},clsSidebarAnimation({mode:t,clsSidebarAnimation:e}){return t==="none"||t==="reveal"?"":e},clsContainerAnimation({mode:t,clsContainerAnimation:e}){return t!=="push"&&t!=="reveal"?"":e},transitionElement({mode:t}){return t==="reveal"?_(this.panel):this.panel}},observe:dn({filter:({swiping:t})=>t}),update:{read(){this.isToggled()&&!R(this.$el)&&this.hide();},events:["resize"]},events:[{name:"touchmove",self:!0,passive:!1,filter(){return this.overlay},handler(t){t.cancelable&&t.preventDefault();}},{name:"show",self:!0,handler(){this.mode==="reveal"&&!P(_(this.panel),this.clsMode)&&(oi(this.panel,"<div>"),y(_(this.panel),this.clsMode));const{body:t,scrollingElement:e}=document;y(t,this.clsContainer,this.clsFlip),c(t,"touch-action","pan-y pinch-zoom"),c(this.$el,"display","block"),c(this.panel,"maxWidth",e.clientWidth),y(this.$el,this.clsOverlay),y(this.panel,this.clsSidebarAnimation,this.mode==="reveal"?"":this.clsMode),et(t),y(t,this.clsContainerAnimation),this.clsContainerAnimation&&Ph();}},{name:"hide",self:!0,handler(){M(document.body,this.clsContainerAnimation),c(document.body,"touch-action","");}},{name:"hidden",self:!0,handler(){this.clsContainerAnimation&&_h(),this.mode==="reveal"&&Pe(this.panel),M(this.panel,this.clsSidebarAnimation,this.clsMode),M(this.$el,this.clsOverlay),c(this.$el,"display",""),c(this.panel,"maxWidth",""),M(document.body,this.clsContainer,this.clsFlip);}},{name:"swipeLeft swipeRight",handler(t){this.isToggled()&&Zt(t.type,"Left")^this.flip&&this.hide();}}]};function Ph(){Co().content+=",user-scalable=0";}function _h(){const t=Co();t.content=t.content.replace(/,user-scalable=0$/,"");}function Co(){return w('meta[name="viewport"]',document.head)||L(document.head,'<meta name="viewport">')}var Ah={mixins:[st],props:{selContainer:String,selContent:String,minHeight:Number},data:{selContainer:".uk-modal",selContent:".uk-modal-dialog",minHeight:150},computed:{container({selContainer:t},e){return U(e,t)},content({selContent:t},e){return U(e,t)}},observe:pt({target:({container:t,content:e})=>[t,e]}),update:{read(){return !this.content||!this.container||!R(this.$el)?!1:{max:Math.max(this.minHeight,et(this.container)-(b(this.content).height-et(this.$el)))}},write({max:t}){c(this.$el,{minHeight:this.minHeight,maxHeight:t});},events:["resize"]}},Oh={props:["width","height"],connected(){y(this.$el,"uk-responsive-width");},observe:pt({target:({$el:t})=>[t,_(t)]}),update:{read(){return R(this.$el)&&this.width&&this.height?{width:_e(_(this.$el)),height:this.height}:!1},write(t){et(this.$el,Qe.contain({height:this.height,width:this.width},t).height);},events:["resize"]}},Dh={props:{offset:Number},data:{offset:0},connected(){Bh(this);},disconnected(){Mh(this);},methods:{async scrollTo(t){t=t&&w(t)||document.body,v(this.$el,"beforescroll",[this,t])&&(await Qs(t,{offset:this.offset}),v(this.$el,"scrolled",[this,t]));}}};const Ve=new Set;function Bh(t){Ve.size||x(document,"click",To),Ve.add(t);}function Mh(t){Ve.delete(t),Ve.size||Bt(document,"click",To);}function To(t){if(!t.defaultPrevented)for(const e of Ve)B(t.target,e.$el)&&ae(e.$el)&&(t.preventDefault(),window.location.href!==e.$el.href&&window.history.pushState({},"",e.$el.href),e.scrollTo(qi(e.$el)));}var Nh={args:"cls",props:{cls:String,target:String,hidden:Boolean,margin:String,repeat:Boolean,delay:Number},data:()=>({cls:"",target:!1,hidden:!0,margin:"-1px",repeat:!1,delay:0,inViewClass:"uk-scrollspy-inview"}),computed:{elements({target:t},e){return t?z(t,e):[e]}},watch:{elements(t){this.hidden&&c(Ie(t,`:not(.${this.inViewClass})`),"opacity",0);}},connected(){this.elementData=new Map;},disconnected(){for(const[t,e]of this.elementData.entries())M(t,this.inViewClass,(e==null?void 0:e.cls)||"");delete this.elementData;},observe:Me({target:({elements:t})=>t,handler(t){const e=this.elementData;for(const{target:i,isIntersecting:s}of t){e.has(i)||e.set(i,{cls:tt(i,"uk-scrollspy-class")||this.cls});const n=e.get(i);!this.repeat&&n.show||(n.show=s);}this.$emit();},options:t=>({rootMargin:t.margin}),args:{intersecting:!1}}),update:[{write(t){for(const[e,i]of this.elementData.entries())i.show&&!i.inview&&!i.queued?(i.queued=!0,t.promise=(t.promise||Promise.resolve()).then(()=>new Promise(s=>setTimeout(s,this.delay))).then(()=>{this.toggle(e,!0),setTimeout(()=>{i.queued=!1,this.$emit();},300);})):!i.show&&i.inview&&!i.queued&&this.repeat&&this.toggle(e,!1);}}],methods:{toggle(t,e){var i;const s=this.elementData.get(t);if(s){if((i=s.off)==null||i.call(s),c(t,"opacity",!e&&this.hidden?0:""),q(t,this.inViewClass,e),q(t,s.cls),/\buk-animation-/.test(s.cls)){const n=()=>Hi(t,"uk-animation-[\\w-]+");e?s.off=j(t,"animationcancel animationend",n):n();}v(t,e?"inview":"outview"),s.inview=e,this.$update(t);}}}},zh={props:{cls:String,closest:String,scroll:Boolean,overflow:Boolean,offset:Number},data:{cls:"uk-active",closest:!1,scroll:!1,overflow:!0,offset:0},computed:{links(t,e){return z('a[href*="#"]',e).filter(i=>i.hash&&ae(i))},elements({closest:t}){return U(this.links,t||"*")}},watch:{links(t){this.scroll&&this.$create("scroll",t,{offset:this.offset||0});}},observe:[Me(),di()],update:[{read(){const t=this.links.map(qi).filter(Boolean),{length:e}=t;if(!e||!R(this.$el))return !1;const i=Ct(t,!0),{scrollTop:s,scrollHeight:n}=i,o=ct(i),r=n-o.height;let a=!1;if(s===r)a=e-1;else {for(let l=0;l<t.length&&!(A(t[l]).top-o.top-this.offset>0);l++)a=+l;a===!1&&this.overflow&&(a=0);}return {active:a}},write({active:t}){const e=t!==!1&&!P(this.elements[t],this.cls);this.links.forEach(i=>i.blur());for(let i=0;i<this.elements.length;i++)q(this.elements[i],this.cls,+i===t);e&&v(this.$el,"active",[t,this.elements[t]]);},events:["scroll","resize"]}]},Fh={mixins:[st,$i],props:{position:String,top:null,bottom:null,start:null,end:null,offset:String,overflowFlip:Boolean,animation:String,clsActive:String,clsInactive:String,clsFixed:String,clsBelow:String,selTarget:String,showOnUp:Boolean,targetOffset:Number},data:{position:"top",top:!1,bottom:!1,start:!1,end:!1,offset:0,overflowFlip:!1,animation:"",clsActive:"uk-active",clsInactive:"",clsFixed:"uk-sticky-fixed",clsBelow:"uk-sticky-below",selTarget:"",showOnUp:!1,targetOffset:!1},computed:{selTarget({selTarget:t},e){return t&&w(t,e)||e}},connected(){this.start=Eo(this.start||this.top),this.end=Eo(this.end||this.bottom),this.placeholder=w("+ .uk-sticky-placeholder",this.$el)||w('<div class="uk-sticky-placeholder"></div>'),this.isFixed=!1,this.setActive(!1);},beforeDisconnect(){this.isFixed&&(this.hide(),M(this.selTarget,this.clsInactive)),Po(this.$el),lt(this.placeholder),this.placeholder=null;},observe:[fn(),di({target:()=>document.scrollingElement}),pt({target:({$el:t})=>[t,document.scrollingElement]})],events:[{name:"load hashchange popstate",el(){return window},filter(){return this.targetOffset!==!1},handler(){const{scrollingElement:t}=document;!location.hash||t.scrollTop===0||setTimeout(()=>{const e=A(w(location.hash)),i=A(this.$el);this.isFixed&&zi(e,i)&&(t.scrollTop=e.top-i.height-ht(this.targetOffset,"height",this.placeholder)-ht(this.offset,"height",this.placeholder));});}},{name:"transitionstart",capture:!0,handler(){this.transitionInProgress=j(this.$el,"transitionend transitioncancel",()=>this.transitionInProgress=null);}}],update:[{read({height:t,width:e,margin:i,sticky:s}){if(this.inactive=!this.matchMedia||!R(this.$el),this.inactive)return;const n=this.isFixed&&!this.transitionInProgress;n&&(_o(this.selTarget),this.hide()),this.active||({height:t,width:e}=A(this.$el),i=c(this.$el,"margin")),n&&this.show();const o=ht("100vh","height"),r=et(window),a=document.scrollingElement.scrollHeight-o;let l=this.position;this.overflowFlip&&t>o&&(l=l==="top"?"bottom":"top");const h=this.isFixed?this.placeholder:this.$el;let u=ht(this.offset,"height",s?this.$el:h);l==="bottom"&&(t<r||this.overflowFlip)&&(u+=r-t);const f=this.overflowFlip?0:Math.max(0,t+u-o),d=A(h).top,g=A(this.$el).height,O=(this.start===!1?d:Cs(this.start,this.$el,d))-u,N=this.end===!1?a:Math.min(a,Cs(this.end,this.$el,d+t,!0)-g-u+f);return s=a&&!this.showOnUp&&O+u===d&&N===Math.min(a,Cs("!*",this.$el,0,!0)-g-u+f)&&c(_(this.$el),"overflowY")==="visible",{start:O,end:N,offset:u,overflow:f,topOffset:d,height:t,elHeight:g,width:e,margin:i,top:Ht(h)[0],sticky:s}},write({height:t,width:e,margin:i,offset:s,sticky:n}){if((this.inactive||n||!this.isFixed)&&Po(this.$el),this.inactive)return;n&&(t=e=i=0,c(this.$el,{position:"sticky",top:s}));const{placeholder:o}=this;c(o,{height:t,width:e,margin:i}),B(o,document)||(o.hidden=!0),(n?ii:si)(this.$el,o);},events:["resize"]},{read({scroll:t=0,dir:e="down",overflow:i,overflowScroll:s=0,start:n,end:o}){const r=document.scrollingElement.scrollTop;return {dir:t<=r?"down":"up",prevDir:e,scroll:r,prevScroll:t,offsetParentTop:A((this.isFixed?this.placeholder:this.$el).offsetParent).top,overflowScroll:Z(s+Z(r,n,o)-Z(t,n,o),0,i)}},write(t,e){const i=e.has("scroll"),{initTimestamp:s=0,dir:n,prevDir:o,scroll:r,prevScroll:a=0,top:l,start:h,topOffset:u,height:f}=t;if(r<0||r===a&&i||this.showOnUp&&!i&&!this.isFixed)return;const d=Date.now();if((d-s>300||n!==o)&&(t.initScroll=r,t.initTimestamp=d),!(this.showOnUp&&!this.isFixed&&Math.abs(t.initScroll-r)<=30&&Math.abs(a-r)<=10))if(this.inactive||r<h||this.showOnUp&&(r<=h||n==="down"&&i||n==="up"&&!this.isFixed&&r<=u+f)){if(!this.isFixed){gt.inProgress(this.$el)&&l>r&&(gt.cancel(this.$el),this.hide());return}this.animation&&r>u?(gt.cancel(this.$el),gt.out(this.$el,this.animation).then(()=>this.hide(),S)):this.hide();}else this.isFixed?this.update():this.animation&&r>u?(gt.cancel(this.$el),this.show(),gt.in(this.$el,this.animation).catch(S)):(_o(this.selTarget),this.show());},events:["resize","resizeViewport","scroll"]}],methods:{show(){this.isFixed=!0,this.update(),this.placeholder.hidden=!1;},hide(){const{offset:t,sticky:e}=this._data;this.setActive(!1),M(this.$el,this.clsFixed,this.clsBelow),e?c(this.$el,"top",t):c(this.$el,{position:"",top:"",width:"",marginTop:""}),this.placeholder.hidden=!0,this.isFixed=!1;},update(){let{width:t,scroll:e=0,overflow:i,overflowScroll:s=0,start:n,end:o,offset:r,topOffset:a,height:l,elHeight:h,offsetParentTop:u,sticky:f}=this._data;const d=n!==0||e>n;if(!f){let g="fixed";e>o&&(r+=o-u,g="absolute"),c(this.$el,{position:g,width:t,marginTop:0},"important");}i&&(r-=s),c(this.$el,"top",r),this.setActive(d),q(this.$el,this.clsBelow,e>a+(f?Math.min(l,h):l)),y(this.$el,this.clsFixed);},setActive(t){const e=this.active;this.active=t,t?(Li(this.selTarget,this.clsInactive,this.clsActive),e!==t&&v(this.$el,"active")):(Li(this.selTarget,this.clsActive,this.clsInactive),e!==t&&v(this.$el,"inactive"));}}};function Cs(t,e,i,s){if(!t)return 0;if(bt(t)||D(t)&&t.match(/^-?\d/))return i+ht(t,"height",e,!0);{const n=t===!0?_(e):at(t,e);return A(n).bottom-(s&&n&&B(e,n)?$(c(n,"paddingBottom")):0)}}function Eo(t){return t==="true"?!0:t==="false"?!1:t}function Po(t){c(t,{position:"",top:"",marginTop:"",width:""});}function _o(t){c(t,"transition","0s"),requestAnimationFrame(()=>c(t,"transition",""));}var Hh={mixins:[yo],args:"src",props:{src:String,icon:String,attributes:"list",strokeAnimation:Boolean},data:{strokeAnimation:!1},observe:[un({async handler(){const t=await this.svg;t&&Ao.call(this,t);},options:{attributes:!0,attributeFilter:["id","class","style"]}})],async connected(){m(this.src,"#")&&([this.src,this.icon]=this.src.split("#"));const t=await this.svg;t&&(Ao.call(this,t),this.strokeAnimation&&jh(t));},methods:{async getSvg(){return G(this.$el,"img")&&!this.$el.complete&&this.$el.loading==="lazy"?new Promise(t=>j(this.$el,"load",()=>t(this.getSvg()))):Wh(await Lh(this.src),this.icon)||Promise.reject("SVG not found.")}}};function Ao(t){const{$el:e}=this;y(t,p(e,"class"),"uk-svg");for(let i=0;i<e.style.length;i++){const s=e.style[i];c(t,s,c(e,s));}for(const i in this.attributes){const[s,n]=this.attributes[i].split(":",2);p(t,s,n);}this.$el.id||ye(t,"id");}const Lh=dt(async t=>t?ot(t,"data:")?decodeURIComponent(t.split(",")[1]):(await fetch(t)).text():Promise.reject());function Wh(t,e){return e&&m(t,"<symbol")&&(t=Rh(t)[e]||t),t=w(t.substr(t.indexOf("<svg"))),(t==null?void 0:t.hasChildNodes())&&t}const Oo=/<symbol([^]*?id=(['"])(.+?)\2[^]*?<\/)symbol>/g,Rh=dt(function(t){const e={};Oo.lastIndex=0;let i;for(;i=Oo.exec(t);)e[i[3]]=`<svg ${i[1]}svg>`;return e});function jh(t){const e=Un(t);e&&c(t,"--uk-animation-stroke",e);}const Ts=".uk-disabled *, .uk-disabled, [disabled]";var Do={mixins:[qt],args:"connect",props:{connect:String,toggle:String,itemNav:String,active:Number,followFocus:Boolean,swiping:Boolean},data:{connect:"~.uk-switcher",toggle:"> * > :first-child",itemNav:!1,active:0,cls:"uk-active",attrItem:"uk-switcher-item",selVertical:".uk-nav",followFocus:!1,swiping:!0},computed:{connects({connect:t},e){return Ce(t,e)},connectChildren(){return this.connects.map(t=>T(t)).flat()},toggles({toggle:t},e){return z(t,e)},children(){return T(this.$el).filter(t=>this.toggles.some(e=>B(e,t)))}},watch:{connects(t){this.swiping&&c(t,"touchAction","pan-y pinch-zoom"),this.$emit();},connectChildren(){let t=Math.max(0,this.index());for(const e of this.connects)T(e).forEach((i,s)=>q(i,this.cls,s===t));this.$emit();},toggles(t){this.$emit();const e=this.index();this.show(~e?e:t[this.active]||t[0]);}},connected(){p(this.$el,"role","tablist");},observe:[Ne({targets:({connectChildren:t})=>t}),dn({target:({connects:t})=>t,filter:({swiping:t})=>t})],events:[{name:"click keydown",delegate(){return this.toggle},handler(t){!C(t.current,Ts)&&(t.type==="click"||t.keyCode===I.SPACE)&&(t.preventDefault(),this.show(t.current));}},{name:"keydown",delegate(){return this.toggle},handler(t){const{current:e,keyCode:i}=t,s=C(this.$el,this.selVertical);let n=i===I.HOME?0:i===I.END?"last":i===I.LEFT&&!s||i===I.UP&&s?"previous":i===I.RIGHT&&!s||i===I.DOWN&&s?"next":-1;if(~n){t.preventDefault();const o=this.toggles.filter(a=>!C(a,Ts)),r=o[rt(n,o,o.indexOf(e))];r.focus(),this.followFocus&&this.show(r);}}},{name:"click",el(){return this.connects.concat(this.itemNav?Ce(this.itemNav,this.$el):[])},delegate(){return `[${this.attrItem}],[data-${this.attrItem}]`},handler(t){U(t.target,"a,button")&&(t.preventDefault(),this.show(tt(t.current,this.attrItem)));}},{name:"swipeRight swipeLeft",filter(){return this.swiping},el(){return this.connects},handler({type:t}){this.show(Zt(t,"Left")?"next":"previous");}}],update(){var t;p(this.connects,"role","presentation"),p(T(this.$el),"role","presentation");for(const e in this.toggles){const i=this.toggles[e],s=(t=this.connects[0])==null?void 0:t.children[e];p(i,"role","tab"),s&&(i.id=At(this,i,`-tab-${e}`),s.id=At(this,s,`-tabpanel-${e}`),p(i,"aria-controls",s.id),p(s,{role:"tabpanel","aria-labelledby":i.id}));}p(this.$el,"aria-orientation",C(this.$el,this.selVertical)?"vertical":null);},methods:{index(){return xt(this.children,t=>P(t,this.cls))},show(t){const e=this.toggles.filter(r=>!C(r,Ts)),i=this.index(),s=rt(!Xe(t)||m(e,t)?t:0,e,rt(this.toggles[i],e)),n=rt(e[s],this.toggles);this.children.forEach((r,a)=>{q(r,this.cls,n===a),p(this.toggles[a],{"aria-selected":n===a,tabindex:n===a?null:-1});});const o=i>=0&&i!==s;this.connects.forEach(async({children:r})=>{const a=Qt(r).filter((l,h)=>h!==n&&P(l,this.cls));await this.toggleElement(a,!1,o),await this.toggleElement(r[n],!0,o);});}}},qh={mixins:[st],extends:Do,props:{media:Boolean},data:{media:960,attrItem:"uk-tab-item",selVertical:".uk-tab-left,.uk-tab-right"},connected(){const t=P(this.$el,"uk-tab-left")?"uk-tab-left":P(this.$el,"uk-tab-right")?"uk-tab-right":!1;t&&this.$create("toggle",this.$el,{cls:t,mode:"media",media:this.media});}};const Uh=32;var Vh={mixins:[$i,qt],args:"target",props:{href:String,target:null,mode:"list",queued:Boolean},data:{href:!1,target:!1,mode:"click",queued:!0},computed:{target({target:t},e){return t=Ce(t||e.hash,e),t.length&&t||[e]}},connected(){m(this.mode,"media")||(ti(this.$el)||p(this.$el,"tabindex","0"),!this.cls&&G(this.$el,"a")&&p(this.$el,"role","button"));},observe:Ne({target:({target:t})=>t}),events:[{name:mt,filter(){return m(this.mode,"hover")},handler(t){this._preventClick=null,!(!St(t)||ie(this._showState)||this.$el.disabled)&&(v(this.$el,"focus"),j(document,mt,()=>v(this.$el,"blur"),!0,e=>!B(e.target,this.$el)),m(this.mode,"click")&&(this._preventClick=!0));}},{name:`mouseenter mouseleave ${Rt} ${Oe} focus blur`,filter(){return m(this.mode,"hover")},handler(t){if(St(t)||this.$el.disabled)return;const e=m(["mouseenter",Rt,"focus"],t.type),i=this.isToggled(this.target);if(!e&&(!ie(this._showState)||t.type!=="blur"&&C(this.$el,":focus")||t.type==="blur"&&C(this.$el,":hover"))){i===this._showState&&(this._showState=null);return}e&&ie(this._showState)&&i!==this._showState||(this._showState=e?i:null,this.toggle(`toggle${e?"show":"hide"}`));}},{name:"keydown",filter(){return m(this.mode,"click")&&!G(this.$el,"input")},handler(t){t.keyCode===Uh&&(t.preventDefault(),this.$el.click());}},{name:"click",filter(){return ["click","hover"].some(t=>m(this.mode,t))},handler(t){let e;(this._preventClick||U(t.target,'a[href="#"], a[href=""]')||(e=U(t.target,"a[href]"))&&(!this.isToggled(this.target)||e.hash&&C(this.target,e.hash)))&&t.preventDefault(),!this._preventClick&&m(this.mode,"click")&&this.toggle();}},{name:"mediachange",filter(){return m(this.mode,"media")},el(){return this.target},handler(t,e){e.matches^this.isToggled(this.target)&&this.toggle();}}],methods:{async toggle(t){if(!v(this.target,t||"toggle",[this]))return;if($t(this.$el,"aria-expanded")&&p(this.$el,"aria-expanded",!this.isToggled(this.target)),!this.queued)return this.toggleElement(this.target);const e=this.target.filter(s=>P(s,this.clsLeave));if(e.length){for(const s of this.target){const n=m(e,s);this.toggleElement(s,n,n);}return}const i=this.target.filter(this.isToggled);await this.toggleElement(i,!1)&&await this.toggleElement(this.target.filter(s=>!m(i,s)),!0);}}},Yh=Object.freeze({__proto__:null,Accordion:go,Alert:wl,Close:lh,Cover:$l,Drop:wo,DropParentIcon:Gt,Dropdown:wo,Dropnav:bo,FormCustom:El,Grid:Pl,HeightMatch:Ol,HeightViewport:Ml,Icon:Ss,Img:vh,Leader:kh,Margin:pn,Marker:hh,Modal:Sh,Nav:Ch,NavParentIcon:nh,Navbar:Th,NavbarParentIcon:Gt,NavbarToggleIcon:ah,Offcanvas:Eh,OverflowAuto:Ah,OverlayIcon:Gt,PaginationNext:uh,PaginationPrevious:fh,Responsive:Oh,Scroll:Dh,Scrollspy:Nh,ScrollspyNav:zh,SearchIcon:oh,SlidenavNext:So,SlidenavPrevious:So,Spinner:rh,Sticky:Fh,Svg:Hh,Switcher:Do,Tab:qh,Toggle:Vh,Totop:ch,Video:mo});return Pt(Yh,(t,e)=>ft.component(e,t)),fl(ft),Pt(ul,(t,e)=>ft.component(e,t)),ft}); 
    } (uikit_min));

    // import './assets/uikit-icons.min.js';


    const app = new App({
    	target: document.body,
    	// props: {
    	// 	name: 'world'
    	// }
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
