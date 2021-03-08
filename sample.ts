import { XmlDocument, parse } from './parser.ts'

let xml = `
<?xml version="1.0" encoding="utf-8" ?>
<China>
    <Henan><![CDATA[<efg>!*#<"'\></Henan>]]></Henan>
    <Shandong>
        <Jinan alias="Quancheng">
            <Lixia />
            <Tianqiao>
                There is a big train station<station type="train">Tianqiao Station<![CDATA[<abc>
!*#<"'\></abc>]]></station>.
            </Tianqiao>
        </Jinan>
    </Shandong>
</China>
`

let parsed : XmlDocument = parse(xml,true)

console.log(JSON.stringify(parsed,null,4))

