
var domify = require('domify');

describe('domify(html)', function(){
  it('should convert HTML to DOM elements', function(){
    var el = domify('<p>Hello</p>')[0];
    assert('P' == el.nodeName);
    assert('Hello' == el.textContent);

    var els = domify('<p>one</p><p>two</p><p>three</p>');
    assert('one' == els[0].textContent);
    assert('two' == els[1].textContent);
    assert('three' == els[2].textContent);
  })

  it('should support body tags', function(){
    var el = domify('<body></body>')[0];
    assert('BODY' == el.nodeName);
  })

  it('should support body tags with classes', function(){
    var el = domify('<body class="page"></body>')[0];
    assert('BODY' == el.nodeName);
    assert('page' == el.className);
  })

  it('should support legend tags', function(){
    var el = domify('<legend>Hello</legend>')[0];
    assert('LEGEND' == el.nodeName);
  })

  it('should support table tags', function(){
    var el = domify('<table></table>')[0];
    assert('TABLE' == el.nodeName);
  })

  it('should support thead tags', function(){
    var el = domify('<thead></thead>')[0];
    assert('THEAD' == el.nodeName);
  })

  it('should support tbody tags', function(){
    var el = domify('<tbody></tbody>')[0];
    assert('TBODY' == el.nodeName);
  })

  it('should support tfoot tags', function(){
    var el = domify('<tfoot></tfoot>')[0];
    assert('TFOOT' == el.nodeName);
  })

  it('should support caption tags', function(){
    var el = domify('<caption></caption>')[0];
    assert('CAPTION' == el.nodeName);
  })

  it('should support col tags', function(){
    var el = domify('<col></col>')[0];
    assert('COL' == el.nodeName);
  })

  it('should support td tags', function(){
    var el = domify('<td></td>')[0];
    assert('TD' == el.nodeName);
  })

  it('should support th tags', function(){
    var el = domify('<th></th>')[0];
    assert('TH' == el.nodeName);
  })

  it('should support tr tags', function(){
    var el = domify('<tr></tr>')[0];
    assert('TR' == el.nodeName);
  })

  it('should support option tags', function(){
    var el = domify('<option></option>')[0];
    assert('OPTION' == el.nodeName);
  })

  it('should support optgroup tags', function(){
    var el = domify('<optgroup></optgroup>')[0];
    assert('OPTGROUP' == el.nodeName);
  })

  it('should not set parentElement', function() {
    var el = domify('<p>Hello</p>')[0];
    assert(!el.parentElement);
    assert(!el.parentNode);
  })
})
