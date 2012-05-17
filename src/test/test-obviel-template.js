/*global module:false obviel:false test:false ok:false same:false $:false
  equal:false raises:false asyncTest:false start:false deepEqual: false
  stop:false  */

module("Template", {
    setup: function() {
        $('#jsview-area').html('<div id="viewdiv"></div><div id="normalize"></div>');
    },
    teardown: function() {
        obviel.template.clear_formatters();
        obviel.clear_registry();
        obviel.compilers.clear_cache();
        obviel.template.set_default_view_name('default');
    }
});

var obtemp = obviel.template;

var normalize_html = function(html) {
    return $('#normalize').html(html).html();
};

var html_equal = function(a, b) {
    equal(a, normalize_html(b));
};

var Translations = function() {
    this._trans = {
        'Hello world!': 'Hallo wereld!',
        'Bye world!': 'Tot ziens wereld!',
        'one < two': 'een < twee',
        'Hello {who}!': '{who}, hallo!',
        'Hello {qualifier} {who}!': '{qualifier} {who}, hallo!'
    };
};

Translations.prototype.gettext = function(msgid) {
    var result = this._trans[msgid];
    if (result === undefined) {
        return msgid;
    }
    return result;
};

var render = function(text, obj) {
    var template = new obtemp.Template(text);
    var el = $('#viewdiv');
    var translations = new Translations();
    template.render(el, obj, translations);
    return el.html();
};

test('template with text, without variable', function() {
    html_equal(render('<p>Hello world!</p>', {}),
               '<p>Hello world!</p>'); 
});

test('render template twice on same element', function() {
    html_equal(render('<p>Hello world!</p>', {}),
               '<p>Hello world!</p>');
    html_equal(render('<p>Bye world!</p>', {}),
               '<p>Bye world!</p>');
});

test("empty element", function() {
    html_equal(render('<p></p>', {}),
               '<p></p>');
});

test("just text", function() {
    html_equal(render("Hello world!", {}),
               'Hello world!');
});

test("text with a variable", function() {
    html_equal(render("Hello {who}!", {who: "world"}),
               'Hello world!');
});


test('text with sub element', function() {
    html_equal(render('<p><em>Sub</em></p>', {}),
               '<p><em>Sub</em></p>');
});

test("text with element with variable", function() {
    html_equal(render("Hello <em>{who}</em>!", {who: "world"}),
               'Hello <em>world</em>!');
});

test('element with empty element', function() {
    html_equal(render('<p><em></em></p>', {}),
               '<p><em></em></p>');
});

test('element with variable', function() {
    html_equal(render('<p>{who}</p>', {who: 'world'}),
               '<p>world</p>');
});

test('element with text and variable', function() {
    html_equal(render('<p>Hello {who}!</p>', {who: 'world'}),
               '<p>Hello world!</p>'); 
});

test('variable and sub element', function() {
    html_equal(render('<p>a <em>very nice</em> {time}, sir!</p>', {time: 'day'}),
               '<p>a <em>very nice</em> day, sir!</p>');
});


test('variable in sub element', function() {
    html_equal(render('<p>a <em>{quality}</em> day, sir!</p>', {quality: 'nice'}),
               '<p>a <em>nice</em> day, sir!</p>');
});


test('template with multiple variables', function() {
    html_equal(render('<p>{first}{second}</p>', {first: 'One', second: 'Two'}),
               '<p>OneTwo</p>');
});

test("variable with dotted name", function() {
    html_equal(render('<p>Hello {something.who}!</p>', {something: {who: 'world'}}),
               '<p>Hello world!</p>');
});

test("variable with formatter", function() {
    obtemp.register_formatter('upper', function(value) {
        return value.toUpperCase();
    });
    html_equal(render('{foo|upper}', {foo: 'hello'}),
          'HELLO');
});

test("variable with formatter that does not exist", function() {
    raises(function() {
        render('{foo|upper}', {foo: 'hello'});
    }, obtemp.CompilationError);
});

// test("variable with built-in html formatter", function() {
//     html_equal(render('<div>{foo|html}</div>', {foo: '<p>This is HTML</p>'}),
//           '<div><p>This is HTML</p></div>');
// });

test("nested scoping", function() {
    html_equal(render('<div data-with="second">{alpha}{beta}</div>',
                 {'beta': 'Beta',
                  second: {alpha: "Alpha"}}),
          '<div>AlphaBeta</div>');
});

test("nested scoping with override", function() {
    html_equal(render('<div data-with="second">{alpha}{beta}</div>',
                 {beta: 'Beta',
                  second: {'alpha': "Alpha",
                           'beta': "BetaOverride"}}),
          '<div>AlphaBetaOverride</div>');
});

test("things disappear out of scope", function() {
    raises(function()  {
        render('<div><div data-with="sub">{foo}</div><div>{foo}</div>',
               {sub:{
                   foo: "Hello!"
               }});
    }, obtemp.RenderError);
    
});

test("variable that does not exist", function() {
    raises(function() {
        render('<p>{who}</p>', {});
    }, obtemp.RenderError);
                 
});

test('attribute variable', function() {
    html_equal(render('<p class="{a}"></p>', {a: 'Alpha'}),
          '<p class="Alpha"></p>');
});

test('attribute text and variable', function() {
    html_equal(render('<p class="the {text}!"></p>', {text: 'thing'}),
          '<p class="the thing!"></p>');
});

test('attribute in sub-element', function() {
    html_equal(render('<p><em class="{a}">foo</em></p>', {a: 'silly'}),
          '<p><em class="silly">foo</em></p>');
});

test('json output for objects', function() {
    html_equal(render('{@.}', {'a': 'silly'}),
          '{\n    "a": "silly"\n}');
});

test('json output for arrays', function() {
    html_equal(render('{@.}', ['a', 'b']),
          "[\n    \"a\",\n    \"b\"\n]");
});


test("element with both id and variable", function() {
    html_equal(render('<p id="foo">{content}</p>', {content: 'hello'}),
          '<p id="foo">hello</p>');
});

test("disallow dynamic id in template", function() {
    raises(function() {
        render('<p id="{dynamic}"></p>', {dynamic: 'test'});
    }, obtemp.CompilationError);
});

test("data-id", function() {
    html_equal(render('<p data-id="{foo}"></p>', {foo: 'Foo'}),
          '<p id="Foo"></p>');
});

test("data-with", function() {
    html_equal(render('<p data-with="alpha">{beta}</p>', {alpha: { beta: "Hello"}}),
          '<p>Hello</p>');
});

test("data-with not pointing to object", function() {
   raises(function() {
        render('<p data-with="alpha"></p>', {alpha: 'not an object'});
   }, obtemp.RenderError);
    
});

test("data-with not pointing to anything", function() {
   raises(function() {
        render('<p data-with="alpha"></p>', {});
   }, obtemp.RenderError);
    
});

test("deeper data-with", function() {
    html_equal(render('<div><p data-with="alpha">{beta}</p></div>',
                 {alpha: { beta: "Hello"}}),
          '<div><p>Hello</p></div>');
});

test("nested data-with", function() {
    html_equal(render('<div data-with="alpha"><div data-with="beta"><div data-with="gamma">{delta}</div></div></div>',
                 {alpha: { beta: { gamma: { delta: "Hello"}}}}),
          '<div><div><div>Hello</div></div></div>');
});

test("data-with with dotted name", function() {
    html_equal(render('<div data-with="alpha.beta.gamma">{delta}</div>',
                 {alpha: { beta: { gamma: { delta: "Hello"}}}}),
          '<div>Hello</div>');
});

// XXX test failure if dotted name has non-end name to name that doesn't exist
// also test with data-with, data-if, data-each

test("data-with with attribute", function() {
    html_equal(render('<div data-with="alpha" class="{beta}"></div>',
                 {alpha: { beta: 'Beta'}}),
          '<div class="Beta"></div>');

});

test("deeper data-with with attribute", function() {
    html_equal(render('<div><div data-with="alpha" class="{beta}"></div></div>',
                 {alpha: { beta: 'Beta'}}),
          '<div><div class="Beta"></div></div>');

});

test("data-if where if is true", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: true,
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is false", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: false,
                 beta: 'Beta'}),
          '');
});

test('data-if with not where data is false', function() {
    html_equal(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: false,
                  beta: 'Beta'}),
          '<div>Beta</div>');
});

test('data-if with not where data is true', function() {
    html_equal(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: true,
                  beta: 'Beta'}),
          '');
});


test('data-if with not where data is null', function() {
    html_equal(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: null,
                  beta: 'Beta'}),
          '<div>Beta</div>');
});

test('data-if with not where data is string', function() {
    html_equal(render('<div data-if="!alpha">{beta}</div>',
                 {alpha: 'something',
                  beta: 'Beta'}),
          '');
});

test("deeper data-if where if is true", function() {
    html_equal(render('<div><div data-if="alpha">{beta}</div></div>',
                {alpha: true,
                 beta: 'Beta'}),
          '<div><div>Beta</div></div>');
});


test("deeper data-if where if is false", function() {
    html_equal(render('<div><div data-if="alpha">{beta}</div></div>',
                {alpha: false,
                 beta: 'Beta'}),
          '<div></div>');
});

test("data-if where if is null", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: null,
                 beta: 'Beta'}),
          '');
});

test("data-if where if is undefined", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: undefined,
                 beta: 'Beta'}),
          '');
});

test("data-if where if is 0", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: 0,
                 beta: 'Beta'}),
          '');
});

test("data-if where if is 1", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: 1,
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is empty string", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: '',
                 beta: 'Beta'}),
          '');
});

test("data-if where if is non-empty string", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: 'non empty',
                 beta: 'Beta'}),
          '<div>Beta</div>');
});

test("data-if where if is empty array", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: [],
                 beta: 'Beta'}),
          '');
});

test("data-if where if is non-empty array", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {alpha: ['a'],
                 beta: 'Beta'}),
          '<div>Beta</div>');
});


test("data-if where if is not there", function() {
    html_equal(render('<div data-if="alpha">{beta}</div>',
                {beta: 'Beta'}),
          '');
});

test("data-with and data-if where if is true", function() {
    html_equal(render('<div data-if="alpha" data-with="beta">{gamma}</div>',
                 {alpha: true,
                  beta: {
                      gamma: "Gamma"
                  }}),
          '<div>Gamma</div>');
});


test("data-with and data-if where if is false", function() {
    html_equal(render('<div data-if="alpha" data-with="beta">{gamma}</div>',
                 {alpha: false,
                  beta: {
                      gamma: "Gamma"
                  }}),
          '');
});


test('data-each with 3 elements', function() {
    html_equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<ul><li>a</li><li>b</li><li>c</li></ul>');
});

test('top-level data each', function() {
    html_equal(render('<p data-each="list">{title}</p>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<p>a</p><p>b</p><p>c</p>');
});

test('data-each with @.', function() {
    html_equal(render('<p data-each="list">{@.}</p>',
                 {list: ['a', 'b', 'c']}),
          '<p>a</p><p>b</p><p>c</p>');
});

test('data-each with 2 elements', function() {
    html_equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with 1 element', function() {
    html_equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: [{title: 'a'}]}),
          '<ul><li>a</li></ul>');
});

test('data-each with 0 elements', function() {
    html_equal(render('<ul><li data-each="list">{title}</li></ul>',
                 {list: []}),
          '<ul></ul>');
});

test('data-each with deeper elements', function() {
    html_equal(render('<ul><li data-each="list"><p>{title}</p></li></ul>',
                 {list: [{title: 'a'},
                         {title: 'b'},
                         {title: 'c'}]}),
          '<ul><li><p>a</p></li><li><p>b</p></li><li><p>c</p></li></ul>');
});
     
test('data-each with attributes', function() {
    html_equal(render('<a data-each="list" href="{url}">link</a>',
                 {list: [{url: 'a'},
                         {url: 'b'}]}),
          '<a href="a">link</a><a href="b">link</a>');

});

test('data-each with text after it', function() {
    html_equal(render('<ul><li data-each="list">{title}</li>after</ul>',
                 {list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li>after</ul>');
});

test('data-each not pointing to array', function() {
    raises(function() {
        render('<p data-each="foo"></p>', {foo: 'not an array'});
    }, obtemp.RenderError);
});
     
test('data-each with data-if and true', function() {
    html_equal(render('<ul><li data-if="flag" data-each="list">{title}</li></ul>',
                 {flag: true,
                  list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul><li>a</li><li>b</li></ul>');

});

test('data-each with data-if and false', function() {
    html_equal(render('<ul><li data-if="flag" data-each="list">{title}</li></ul>',
                 {flag: false,
                  list: [{title: 'a'},
                         {title: 'b'}]}),
          '<ul></ul>');

});

test('data-each with data-with', function() {
    html_equal(render('<ul><li data-each="list" data-with="sub">{title}</li></ul>',
                 {list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with data-with and data-if and true', function() {
    html_equal(render('<ul><li data-if="flag" data-each="list" data-with="sub">{title}</li></ul>',
                 {flag: true,
                  list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul><li>a</li><li>b</li></ul>');
});

test('data-each with data-with and data-if and false', function() {
    html_equal(render('<ul><li data-if="flag" data-each="list" data-with="sub">{title}</li></ul>',
                 {flag: false,
                  list: [{sub: {title: 'a'}},
                         {sub: {title: 'b'}}]}),
          '<ul></ul>');
});

test('data-each with data-trans', function() {
    html_equal(render(
        '<ul><li data-each="list" data-trans="">Hello world!</li></ul>',
        {list: [1, 2]}),
          '<ul><li>Hallo wereld!</li><li>Hallo wereld!</li></ul>');
});

test('nested data-each', function() {
    html_equal(render(
        '<ul><li data-each="outer"><ul><li data-each="inner">{title}</li></ul></li></ul>',
        {outer: [
            {inner: [{title: 'a'}, {title: 'b'}]},
            {inner: [{title: 'c'}, {title: 'd'}]}
        ]}),
          '<ul><li><ul><li>a</li><li>b</li></ul></li><li><ul><li>c</li><li>d</li></ul></li></ul>');
    
});


test("data-trans with text", function() {
    html_equal(render('<p data-trans="">Hello world!</p>', {}),
          '<p>Hallo wereld!</p>');
});

test('data-trans with text, translation not there', function() {
    html_equal(render('<p data-trans="">This is not translated</p>', {}),
          '<p>This is not translated</p>');
});

test("data-trans with text & entity reference", function() {
    html_equal(render('<p data-trans="">one &lt; two</p>', {}),
          '<p>een &lt; twee</p>');
});

test("data-trans with text & comment", function() {
    html_equal(render('<p data-trans="">Hello world!<!-- comment -->', {}),
          '<p>Hallo wereld!</p>');
});

test("data-trans with text & comment and element", function() {
    html_equal(render('<p data-trans=""><!-- comment -->Hello <!-- comment --><em data-tvar="who">{who}</em>!</p>',
                 {who: "Bob"}),
          '<p><em>Bob</em>, hallo!</p>');
});

// CDATA is too different in browsers and not really sensible to support
// see also CDATASection in HTML for more info:
// http://reference.sitepoint.com/javascript/CDATASection
// test("data-trans with text & CDATA section", function() {
//     html_equal(render('<p data-trans=""><![CDATA[Hello world!]]></p>', {}),
//           '<p>Hallo wereld!</p>');
// });

test("data-trans with variable", function() {
    html_equal(render('<p data-trans="">Hello {who}!</p>', {who: "Fred"}),
          '<p>Fred, hallo!</p>');
});

test('data-trans with data-tvar', function() {
    html_equal(render('<p data-trans="">Hello <em data-tvar="who">world</em>!</p>',
                 {}),
          '<p><em>world</em>, hallo!</p>');
});

test('data-trans with data-tvar and variable in tvar', function() {
    html_equal(render('<p data-trans="">Hello <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld'}),
          '<p><em>wereld</em>, hallo!</p>');
});

test('data-trans with data-tvar and variable in text', function() {
    html_equal(render('<p data-trans="">Hello {qualifier} <em data-tvar="who">{who}</em>!</p>',
                 {who: 'wereld',
                  qualifier: 'beste'}),
          '<p>beste <em>wereld</em>, hallo!</p>');
    
});

test('data-trans with just variable, no text', function() {
    raises(function() {
        render('<p data-trans="">{hello}</p>', {hello: 'Hello!'});
    }, obtemp.CompilationError);
});

test('data-trans used on whitespace', function() {
    raises(function() {
        render('<p data-trans="">   </p>');
    }, obtemp.CompilationError);
    
});

test('data-trans without text altogether', function() {
    raises(function() {
        render('<p data-trans=""></p>');
    }, obtemp.CompilationError);
    
});

/* XXX

  tvar implies data-trans


  tvar should be unique, also compared to variables


  explicit naming
*/

test('included html is escaped', function() {
    html_equal(render('<p>{html}</p>', {html: '<em>test</em>'}),
          '<p>&lt;em&gt;test&lt;/em&gt;</p>');
});

test('data-view', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    html_equal(render('<div data-view="bob"></div>', {bob: {iface: 'person',
                                                       name: 'Bob'}}),
          '<div><p>Bob</p></div>');
});

test('data-view with named view', function() {
    obviel.view({
        iface: 'person',
        name: 'summary',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    html_equal(render('<div data-view="bob|summary"></div>', {bob: {iface: 'person',
                                                               name: 'Bob'}}),
          '<div><p>Bob</p></div>');

});

test('data-view with altered default view', function() {
    obviel.view({
        iface: 'person',
        name: 'summary',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });

    obtemp.set_default_view_name('summary');
    
    html_equal(render('<div data-view="bob"></div>', {bob: {iface: 'person',
                                                       name: 'Bob'}}),
          '<div><p>Bob</p></div>');

});


// XXX data-view with data-trans

test('data-view with data-with', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    html_equal(render('<div data-with="sub" data-view="person">person</div>',
                 {sub: {person: {iface: 'person',
                                 name: 'Bob'}}}),
          '<div><p>Bob</p></div>');
});

test('deeper data-view with data-with', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    html_equal(render('<div><div data-with="sub" data-view="person">person</div></div>',
                 {sub: {person: {iface: 'person',
                                 name: 'Bob'}}}),
          '<div><div><p>Bob</p></div></div>');
});

test('data-view with data-if where if is true', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    
    html_equal(render('<div data-if="flag" data-view="person">person</div>',
                 {person: {iface: 'person',
                           name: 'Bob'},
                  flag: true}),
          '<div><p>Bob</p></div>');
    
});

test('data-view with deeper data-if where if is false', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    

    html_equal(render('<div><div data-if="flag" data-view="person"></div></div>',
                 {person: {iface: 'person',
                           name: 'Bob'},
                  flag: false}),
          '<div></div>');

});

test('data-view with data-each', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    html_equal(render('<div data-each="persons" data-view="@."></div>',
                 {persons: [
                     {iface: 'person',
                      name: 'Bob'},
                     {iface: 'person',
                      name: 'Jay'},
                     {iface: 'person',
                      name: 'Stephen'}]}),
          '<div><p>Bob</p></div><div><p>Jay</p></div><div><p>Stephen</p></div>');
    
});


test('deeper data-view with data-each', function() {
    obviel.view({
        iface: 'person',
        render: function() {
            this.el.empty();
            this.el.append('<p>' + this.obj.name + '</p>');
        }
    });
    
    html_equal(render('<div><div data-each="persons" data-view="@."></div></div>',
                 {persons: [
                     {iface: 'person',
                      name: 'Bob'},
                     {iface: 'person',
                      name: 'Jay'},
                     {iface: 'person',
                      name: 'Stephen'}]}),
          '<div><div><p>Bob</p></div><div><p>Jay</p></div><div><p>Stephen</p></div></div>');
    
});

// XXX data-view with data-trans not allowed
// XXX data-view with any content that isn't attribute is not allowed

// test('data-view with data-trans on same element is not allowed', function() {
//     //raises(function() {
//         render('<div data-view="foo" data-trans="bar">foo</div>', {});
//     //}, obtemp.CompilationError);
// });

test('tokenize single variable', function() {
    deepEqual(obtemp.tokenize("{foo}"), [{type: obtemp.NAME_TOKEN,
                                          value: 'foo'}]);
    
});

test('tokenize variable in text', function() {
    deepEqual(obtemp.tokenize("the {foo} is great"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'the '},
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.TEXT_TOKEN,
                   value: ' is great'}
              ]);
    
});

test('tokenize variable starts text', function() {
    deepEqual(obtemp.tokenize("{foo} is great"),
              [
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.TEXT_TOKEN,
                   value: ' is great'}
              ]);
    
});

test('tokenize variable ends text', function() {
    deepEqual(obtemp.tokenize("great is {foo}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'great is '},
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'}
              ]);
    
});

test('tokenize two variables follow', function() {
    deepEqual(obtemp.tokenize("{foo}{bar}"),
              [
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'bar'}
              ]);
});

test('tokenize two variables with text', function() {
    deepEqual(obtemp.tokenize("a{foo}b{bar}c"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'a'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'},
                  {type: obtemp.TEXT_TOKEN,
                   value: 'b'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'bar'},
                  {type: obtemp.TEXT_TOKEN,
                   value: 'c'}
              ]);
});


test('tokenize no variables', function() {
    deepEqual(obtemp.tokenize("Hello world!"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'Hello world!'}
              ]);
});

test('tokenize open but no close', function() {
    deepEqual(obtemp.tokenize("{foo"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{foo'}
              ]);
});

test('tokenize open but no close after text', function() {
    deepEqual(obtemp.tokenize("after {foo"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'after {foo'}
              ]);
});

test('tokenize open but no close after variable', function() {
    deepEqual(obtemp.tokenize("{bar} after {foo"),
              [
                  {"type": obtemp.NAME_TOKEN,
                   "value": "bar"},
                  {"type": obtemp.TEXT_TOKEN,
                   "value": " after {foo"} 
              ]);
});

test('tokenize just close', function() {
    deepEqual(obtemp.tokenize("foo } bar"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: 'foo } bar'}
              ]);
});

test('tokenize empty variable', function() {
    deepEqual(obtemp.tokenize("{}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{}'}
              ]);

});

test('tokenize whitespace variable', function() {
    deepEqual(obtemp.tokenize("{ }"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{ }'}
              ]);

});

test('tokenize non-trimmed variable', function() {
    deepEqual(obtemp.tokenize("{foo }"),
              [
                  {type: obtemp.NAME_TOKEN,
                   value: 'foo'}
              ]);

});

test('tokenize whitespace after {', function() {
    deepEqual(obtemp.tokenize("{ foo}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{ foo}'}
              ]);
});

test('tokenize whitespace after { with variable', function() {
    deepEqual(obtemp.tokenize("{ foo}{bar}"),
              [
                  {type: obtemp.TEXT_TOKEN,
                   value: '{ foo}'},
                  {type: obtemp.NAME_TOKEN,
                   value: 'bar'}
              ]);

});

