# ts-xml-parser
A better xml parser written in pure typescript and works well with deno.

# Usage

Import:
~~~ts
// remote import in Deno
import parse from "https://denopkg.com/FullStackPlayer/ts-xml-parser/parser.ts"
// local import in Deno
import parse from "path/to/parser.ts"
~~~

Simple:
~~~ts
let xml = `
<?xml version="1.0" encoding="utf-8" ?> 
<tagA></tagA>
`
let parsed = parse(xml)
// parsed:
// {
//    "declaration": {
//        "attributes": {
//            "version": "1.0",
//            "encoding": "utf-8"
//        }
//    },
//    "root": {
//        "name": "tagA"
//    }
//}
~~~

Namespace:
~~~ts
let xml = `
<?xml version="1.0" encoding="utf-8" ?> 
<propfind xmlns="DAV:" xmlns:R="RES:">
    <R:allprop/>
</propfind>
`
let parsed = parse(xml,true)    // true means prefixing namespace before tag name
// parsed:
// {
//     "declaration": {
//         "attributes": {
//             "version": "1.0",
//             "encoding": "utf-8"
//         }
//     },
//     "root": {
//         "name": "DAV:propfind",
//         "attributes": {
//             "xmlns": "DAV:",
//             "xmlns:R": "RES:"
//         },
//         "children": [
//             {
//                 "name": "RES:allprop"
//             }
//         ]
//     }
// }
~~~

Content:
~~~ts
let xml = `
<?xml version="1.0" encoding="utf-8" ?> 
<tagA>
    abc<![CDATA[123一二三]]>
</tagA>
`
let parsed = parse(xml)
// parsed:
// {
//     "declaration": {
//         "attributes": {
//             "version": "1.0",
//             "encoding": "utf-8"
//         }
//     },
//     "root": {
//         "name": "tagA",
//         "content": "abc<![CDATA[123一二三]]>"
//     }
// }
~~~

Mixed Content (a node owns text content and child nodes at the same time):
~~~ts
let xml = `
<?xml version="1.0" encoding="utf-8" ?>
<father>
    I have a son named John<fullname>Johnson</fullname>.
</father>
`
let parsed = parse(xml)
// parsed:
// {
//     "declaration": {
//         "attributes": {
//             "version": "1.0",
//             "encoding": "utf-8"
//         }
//     },
//     "root": {
//         "name": "father",
//         "children": [
//             {
//                 "name": "fullname",
//                 "content": "Johnson"
//             }
//         ],
//         "content": "I have a son named John."
//     }
// }
~~~

Deep Structure:
~~~ts
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
// parsed
// {
//     "declaration": {
//         "attributes": {
//             "version": "1.0",
//             "encoding": "utf-8"
//         }
//     },
//     "root": {
//         "name": "China",
//         "children": [
//             {
//                 "name": "Henan"
//             },
//             {
//                 "name": "Shandong",
//                 "children": [
//                     {
//                         "name": "Jinan",
//                         "attributes": {
//                             "alias": "Quancheng"
//                         },
//                         "children": [
//                             {
//                                 "name": "Lixia"
//                             },
//                             {
//                                 "name": "Tianqiao",
//                                 "children": [
//                                     {
//                                         "name": "station",
//                                         "attributes": {
//                                             "type": "train"
//                                         },
//                                         "content": "Tianqiao Station"
//                                     }
//                                 ],
//                                 "content": "There is a big train station."
//                             }
//                         ]
//                     }
//                 ]
//             }
//         ]
//     }
// }
~~~

# ATTENTION

- If you have single `\` characters in `<![CDATA[]>`, it will be ignored as an `escape character`, if this is necessary, type `\\` instead.

- `<![CDATA[]>` can not be nested in a node content, if you indeed want to do that, encode your inner `<![CDATA[]>` first, of course the receiver side should decode the content either.

## Enjoy Yourself!