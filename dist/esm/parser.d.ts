/**
 * XML解析器
 * Copyright 2020 FullStackPlayer. All rights reserved.
 */
export declare type Attributes = {
    [key: string]: string;
};
/**
 * 解析出来的 JSON 结构
 */
export interface XmlDocument {
    declaration: {
        attributes: Attributes;
    } | undefined;
    root: XmlNode | undefined;
}
/**
 * 单个 xml 节点结构
 */
export interface XmlNode {
    name: string;
    attributes?: Attributes;
    content?: string;
    children?: XmlNode[];
}
/**
 * 将 xml 字符串解析成 json 对象
 * @param xml 需要解析的 xml 源码
 * @returns XmlDocument 文档
 */
export declare function parse(xml: string, withNS?: boolean): XmlDocument;
export default parse;
