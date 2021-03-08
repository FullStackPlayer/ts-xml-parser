import { assertEquals, assertThrows } from "https://deno.land/std@0.89.0/testing/asserts.ts"
import { parse } from '../parser.ts'

Deno.test('Empty String', ()=>{
    let xml = ``
    let parsed = parse(xml)
    assertEquals(parsed.declaration,undefined)
    assertEquals(parsed.root,undefined)
})

Deno.test('Only Declaration', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?> 
    `
    let parsed = parse(xml)
    assertEquals(parsed.declaration, {
        attributes: {
            version: '1.0',
            encoding: 'utf-8'
        }
    })
    assertEquals(parsed.root,undefined)
})

Deno.test('Only Element', ()=>{
    let xml = `
    <tagA></tagA>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA'
    })
    assertEquals(parsed.declaration,undefined)
})

Deno.test('Multiple Elements', ()=>{
    let xml = `
    <tagA></tagA>
    <tagB></tagB>
    `
    try {
        parse(xml)
    }
    catch(err) {
        assertEquals(err, new Error('XML源码不符合规范：有不止1个根节点'))
    }
})

Deno.test('Self Close Element', ()=>{
    let xml = `
    <tagA/>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA'
    })
    xml = `
    <tagA />
    `
    parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA'
    })
    xml = `
    <tagA xmlns="DAV:" />
    `
    parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA',
        attributes: {
            'xmlns': 'DAV:'
        }
    })
})

Deno.test('Open And Close Pairs', ()=>{
    let xml = `
    <tagA></tagA>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA'
    })
    xml = `
    <tagA>
    something
    </tagA>
    `
    parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA',
        content: 'something'
    })
    xml = `
    <tagA xmlns="DAV:" >
    something
    </tagA>
    `
    parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA',
        content: 'something',
        attributes: {
            'xmlns': 'DAV:'
        }
    })
})

Deno.test('CDATA content', ()=>{
    let xml = `
    <tagA>
    <![CDATA[123一二三]]>
    </tagA>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root, {
        name: 'tagA',
        content: '<![CDATA[123一二三]]>'
    })
})
