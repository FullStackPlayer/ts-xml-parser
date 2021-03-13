"use strict";
/**
 * XML解析器
 * Copyright 2020 FullStackPlayer. All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = void 0;
/**
 * 将 xml 字符串解析成 json 对象
 * @param xml 需要解析的 xml 源码
 * @returns XmlDocument 文档
 */
function parse(xml, withNS) {
    // 去掉两端空格和注释
    xml = xml.trim();
    xml = xml.replace(/<!--[\s\S]*?-->/g, "");
    // 空文档对象
    var doc = {
        declaration: undefined,
        root: undefined
    };
    // 解析声明头
    doc.declaration = declaration();
    // 在解析内容前先将 CDATA 里影响解析的特殊字符替换掉
    var m = xml.match(/<!\[CDATA\[[\s\S]*?\]\]>/gm);
    // 如果有 CDATA
    if (m) {
        // 分别完成替换
        for (var _i = 0, m_1 = m; _i < m_1.length; _i++) {
            var str = m_1[_i];
            xml = xml.replace(str, encodeCDATA(str));
        }
    }
    // 解析 xml 数据
    var parsed = parseAll(xml);
    if (parsed) {
        if (parsed.children.length === 1 && typeof parsed.children[0] !== 'string')
            doc.root = parsed.children[0];
        else
            throw new Error('XML源码不符合规范：有不止1个根节点');
    }
    // 添加命名空间
    if (doc.root && withNS === true)
        applyNS(doc.root);
    return doc;
    /**
     * 对 CDATA 内容编码
     * @param str 要编码的内容
     * @returns 编码后的内容
     */
    function encodeCDATA(str) {
        var shadow = str
            .split("<![CDATA[")[1].split("]]>")[0]
            .replace(/</, "[_*[$(<)$]*_]").replace(/>/, "[_*[$(>)$]*_]").replace(/\//, "[_*[$(/)$]*_]").replace(/\\/, "[_*[$(LS)$]*_]");
        return "<![CDATA[" + shadow + "]]>";
    }
    /**
     * 对 CDATA 内容解码
     * @param str 被编码的字符串
     * @returns 解码后的内容
     */
    function decodeCDATA(str) {
        var m = str.match(/<!\[CDATA\[[\s\S]*?\]\]>/gm);
        // 如果有 CDATA
        if (m) {
            // 分别完成替换
            for (var _i = 0, m_2 = m; _i < m_2.length; _i++) {
                var cdata = m_2[_i];
                var shadow = cdata
                    .split("<![CDATA[")[1].split("]]>")[0]
                    .replace(/\[_\*\[\$\(<\)\$\]\*\_]/, "<").replace(/\[_\*\[\$\(>\)\$\]\*_]/, ">").replace(/\[_\*\[\$\(\/\)\$\]\*_]/, "/").replace(/\[_\*\[\$\(LS\)\$\]\*_]/, "\\");
                str = str.replace(cdata, "<![CDATA[" + shadow + "]]>");
            }
        }
        return str;
    }
    /**
     * 解析 xml 文件声明，解析完成后会从代码中删除
     * @returns 全部属性
     */
    function declaration() {
        var temp = '';
        var m = xml.match(/^<\?xml[\s\S]*\?>/m);
        // 无匹配
        if (!m)
            return;
        // 有匹配
        else {
            temp = m[0];
            // 从源码中删除
            xml = xml.slice(temp.length);
        }
        // 解析属性（这里借助一个空节点结构）
        var node = {
            name: ''
        };
        getAttributes(temp, node);
        if (node.attributes)
            return {
                attributes: node.attributes
            };
        return;
    }
    /**
     * 解析全部代码
     * @param str 要解析的字符串
     * @returns 节点数组或者undefined
     */
    function parseAll(str) {
        var all = [];
        var loop = true;
        while (loop) {
            // 检查有无可用标签
            var firstTag = getFirstTag(str);
            if (!firstTag)
                loop = false;
            else {
                // console.log(firstTag)
                var targetStr = '';
                // 空节点
                var node = undefined;
                // 解析自关闭节点内容
                if (firstTag.type === 'selfClose') {
                    targetStr = firstTag.str;
                    node = parseNode(targetStr, firstTag.name, true);
                }
                // 解析正常开闭节点内容
                if (firstTag.type === 'normal') {
                    targetStr = firstTag.strs['outer'];
                    node = parseNode(firstTag.strs, firstTag.name, false);
                }
                // 加入结果
                if (node)
                    all.push(node);
                // 删除已解析内容
                str = str.replace(targetStr, '');
            }
        }
        // 删除剩余内容中无意义的换行和两端空格
        str = str.replace(/[\r\n]/g, '').trim();
        if (all.length === 0)
            return undefined;
        else
            return {
                children: all,
                strLeft: str
            };
    }
    /**
     * 解析代码中的节点
     * @param target 要解析的字符串
     * @param tagName 标签名称
     * @param isSelfClose 是否自关闭
     * @returns 解析出的节点或者undefined
     */
    function parseNode(target, tagName, isSelfClose) {
        // 空节点
        var node = {
            name: tagName
        };
        if (isSelfClose === true) {
            parseSelfCloseTag(target, node);
        }
        else {
            parseNormalTag(target, node);
        }
        return node;
    }
    /**
     * 解析自关闭节点
     * @param str 要解析的内容
     * @param node 当前节点
     */
    function parseSelfCloseTag(str, node) {
        // 只要取属性即可，没有内容和子成员
        getAttributes(str, node);
    }
    /**
     * 解析正常开闭的节点
     * @param str 要解析的内容
     * @param node 当前节点
     */
    function parseNormalTag(strs, node) {
        // 取属性
        getAttributes(strs['attrs'], node);
        var str = strs['inner'];
        // 判断内部是否还有子节点
        if (str.match(/<(?<tag>[\w:]+)([^<^>])*?\/>/m)
            ||
                str.match(/<(?<tag>[\w:]+)[\s\S]*?>[\s\S]*?<\/\k<tag>*?>/m)) {
            // 有子节点则要考虑可能同时含有 content 和 children 的情况
            var res = parseAll(str);
            if (res) {
                // 取出子节点
                if (res.children && res.children.length > 0)
                    node.children = res.children;
                // 如果有剩余内容就是 content
                if (res.strLeft !== '') {
                    res.strLeft = res.strLeft.replace(/[\r\n]/g, '').trim();
                    node.content = decodeCDATA(res.strLeft);
                }
            }
        }
        else {
            // 没有子节点直接作为 content
            if (str !== '') {
                str = str.replace(/[\r\n]/g, '').trim();
                node.content = decodeCDATA(str);
            }
        }
    }
    /**
     * 获取第一个标签
     * @param str 要解析的字符串
     * @returns 节点类型以及完整字符串
     */
    function getFirstTag(str) {
        var m = str.match(/<([\w-:.]+)\s*/m);
        if (!m)
            return;
        else {
            var tagName = m[1];
            var selfCloseStr = getSelfCloseNode(str, tagName);
            if (selfCloseStr) {
                return {
                    type: 'selfClose',
                    name: tagName,
                    str: selfCloseStr
                };
            }
            var normalStr = getNormalNode(str, tagName);
            if (normalStr) {
                return {
                    type: 'normal',
                    name: tagName,
                    strs: normalStr
                };
            }
            return;
        }
    }
    /**
     * 获得自关闭标签内容
     * @param str 要解析的字符串
     * @param tagName 当前节点名称
     * @returns 匹配的字符串（一个完整的自关闭节点）
     */
    function getSelfCloseNode(str, tagName) {
        var reg = new RegExp("<" + tagName + "[^<^>]*?/>", 'm');
        var m = str.match(reg);
        if (!m)
            return;
        else
            return m[0];
    }
    /**
     *
     * @param str 要解析的字符串
     * @param tagName 当前节点名称
     * @returns outer:完整字符串，attr:属性字符串，inner:内部字符串
     */
    function getNormalNode(str, tagName) {
        var reg = new RegExp("<" + tagName + "([\\s\\S]*?)>([\\s\\S]*?)</" + tagName + ">", 'gm');
        var m = reg.exec(str);
        // console.log(m)
        if (!m)
            return;
        else
            return {
                outer: m[0],
                attrs: m[1],
                inner: m[2]
            };
    }
    /**
     * 解析字符串中的全部属性
     * @param str 要解析的字符串
     * @returns void
     */
    function getAttributes(str, node) {
        var loop = true;
        while (loop) {
            // 按顺序解析第一组
            var m_3 = str.match(/([\w:-]+)\s*=\s*("[^"]*"|'[^']*'|\w+)\s*/);
            // 没有匹配则停止解析
            if (!m_3)
                loop = false;
            // 有匹配
            else {
                // 保存属性
                if (!node.attributes)
                    node.attributes = {};
                node.attributes[m_3[1]] = strip(m_3[2]);
                // 删除已经匹配过的内容
                str = str.replace(m_3[0], '');
            }
        }
    }
    /**
     * 去掉属性的引号
     */
    function strip(val) {
        return val.replace(/^['"]|['"]$/g, "");
    }
    /**
     * 将节点名称替换成包含命名空间的全名
     * @param node 要替换的节点
     * @param ns 上级命名空间定义
     */
    function applyNS(node, ns) {
        // 全部命名空间
        var nsMap = {};
        // 拷贝上级数据
        if (ns) {
            for (var _i = 0, _a = Object.keys(ns); _i < _a.length; _i++) {
                var key = _a[_i];
                nsMap[key] = ns[key];
            }
        }
        // 加入本级数据
        if (node.attributes) {
            var keys = Object.keys(node.attributes);
            for (var _b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
                var key = keys_1[_b];
                // 默认
                if (key === 'xmlns')
                    nsMap['_'] = node.attributes[key];
                // 
                if (key.indexOf('xmlns:') === 0) {
                    var prefix = key.replace('xmlns:', '');
                    nsMap[prefix] = node.attributes[key];
                }
            }
            // console.log(nsMap)
        }
        // 替换节点名称
        // 查找是否有默认命名空间
        if (node.name.indexOf(':') < 0) {
            if (nsMap['_']) {
                node.name = nsMap['_'] + node.name;
            }
        }
        // 替换前缀命名空间
        else if (node.name.indexOf(':') > 0
            &&
                node.name.split(':')[0] !== 'http'
            &&
                node.name.split(':')[0] !== 'https') {
            var prefix = node.name.split(':')[0];
            if (nsMap[prefix]) {
                node.name = node.name.replace(prefix + ":", "" + nsMap[prefix]);
            }
        }
        // 递归获取
        if (node.children) {
            for (var _c = 0, _d = node.children; _c < _d.length; _c++) {
                var child = _d[_c];
                applyNS(child, nsMap);
            }
        }
    }
}
exports.parse = parse;
exports.default = parse;
