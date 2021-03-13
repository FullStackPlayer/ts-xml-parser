import { assertEquals } from "https://deno.land/std@0.89.0/testing/asserts.ts"
import { parse } from '../mod.ts'

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


Deno.test('Child Element', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <D:propfind xmlns:D="DAV:">
        <D:allprop/>
    </D:propfind>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root?.name, 'D:propfind')
    assertEquals(parsed.root?.children,[{
        name: 'D:allprop'
    }])
})

Deno.test('Multiple Child Elements', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <parent>
        <child/>
        <child/>
    </parent>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root?.children?.length,2)
    xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <parent>
        <childA/>
        <childA/>
        <childB>B</childB>
    </parent>
    `
    parsed = parse(xml)
    assertEquals(parsed.root?.children?.length,3)
})

Deno.test('Global Namespace', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <propfind xmlns="DAV:">
        <allprop />
    </propfind>
    `
    let parsed = parse(xml,true)
    assertEquals(parsed.root?.name, 'DAV:propfind')
    assertEquals(parsed.root?.children,[{
        name: 'DAV:allprop'
    }])
})

Deno.test('Named Namespace', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <D:propfind xmlns:D="DAV:" xmlns:R="RES:">
        <R:allprop/>
    </D:propfind>
    `
    let parsed = parse(xml,true)
    assertEquals(parsed.root?.name, 'DAV:propfind')
    assertEquals(parsed.root?.children,[{
        name: 'RES:allprop'
    }])
})

Deno.test('Mixed Namespace', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <propfind xmlns="DAV:" xmlns:R="RES:">
        <R:allprop/>
    </propfind>
    `
    let parsed = parse(xml,true)
    assertEquals(parsed.root?.name, 'DAV:propfind')
    assertEquals(parsed.root?.children,[{
        name: 'RES:allprop'
    }])
})

Deno.test('Mixed Content', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <father>
        I have a son named John<fullname>Johnson</fullname>.
    </father>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root?.children,[{
        name: 'fullname',
        content: 'Johnson'
    }])
    assertEquals(parsed.root?.content,'I have a son named John.')
})

Deno.test('Special CDATA Inner Text', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <Henan><![CDATA[<efg>!*#<"'></Henan>]]></Henan>
    `
    let parsed = parse(xml)
    assertEquals(parsed.root?.content,`<![CDATA[<efg>!*#<"'></Henan>]]>`)
    // 注意字符串里的单个 \ 会被视作转义符，编码解码后会消失
    xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <Henan><![CDATA[<efg>!*#\<"'></Henan>]]></Henan>
    `
    parsed = parse(xml)
    assertEquals(parsed.root?.content,`<![CDATA[<efg>!*#<"'></Henan>]]>`)
    // 如果需要保存单个 \ ，那么要在字符串里写 \\
    xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <Henan><![CDATA[<efg>!*#\\<"'></Henan>]]></Henan>
    `
    parsed = parse(xml)
    assertEquals(parsed.root?.content,`<![CDATA[<efg>!*#\\<"'></Henan>]]>`)
})

Deno.test('Deep Structure', ()=>{
    let xml = `
    <?xml version="1.0" encoding="utf-8" ?>
    <China>
        <Henan></Henan>
        <Shandong>
            <Jinan alias="Quancheng">
                <Lixia />
                <Tianqiao>
                    There is a big train station<station type="train">Tianqiao Station</station>.
                </Tianqiao>
            </Jinan>
        </Shandong>
    </China>
    `
    let parsed = parse(xml)
    assertEquals(parsed,{
        "declaration": {
            "attributes": {
                "version": "1.0",
                "encoding": "utf-8"
            }
        },
        "root": {
            "name": "China",
            "children": [
                {
                    "name": "Henan"
                },
                {
                    "name": "Shandong",
                    "children": [
                        {
                            "name": "Jinan",
                            "attributes": {
                                "alias": "Quancheng"
                            },
                            "children": [
                                {
                                    "name": "Lixia"
                                },
                                {
                                    "name": "Tianqiao",
                                    "children": [
                                        {
                                            "name": "station",
                                            "attributes": {
                                                "type": "train"
                                            },
                                            "content": "Tianqiao Station"
                                        }
                                    ],
                                    "content": "There is a big train station."
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    })
})

