import React, { useEffect, useRef, useState } from "react";
import * as joint from "jointjs";
import { v4 as uuidv4 } from 'uuid';
import './MyComponent.css'; // CSSファイルをインポート
//import PetriNetEditor from "./PetriNetEditor";

const FlowEditor: React.FC = () => {
    // JointJSのインスタンスを保持するためのRef
    const graphRef = useRef(new joint.dia.Graph());
    //const [graphRef, setGraph] = useState<joint.dia.Graph | null>(null);
    const paperRef = useRef<HTMLDivElement>(null);
    const paperInstance = useRef<joint.dia.Paper | null>(null);

    // ARC追加用のステート
    const [nodes, setNodes] = useState<{ id: string; label: string }[]>([]);
    const [source, setSource] = useState("");
    const [target, setTarget] = useState("");

    // ARC削除用のステート
    const [links, setLinks] = useState<{ id: string; source: string; target: string }[]>([]);
    const [selectedLink, setSelectedLink] = useState("");

    // ノード削除用のステート
    const [selectedNode, setSelectedNode] = useState("");

    // ズーム用のステート
    const [zoomLevel, setZoomLevel] = useState(1); // 初期倍率 1

    useEffect(() => {
        if (!paperRef.current) {
            console.log("paperRef.current is null! Waiting for render...");
            return;
        }

        paperInstance.current = new joint.dia.Paper({
            el: paperRef.current,
            model: graphRef.current,
            width: 900,
            height: 450,
            gridSize: 10,
            drawGrid: true,
            background: { color: "#f8f9fa" },
            interactive: true,
        });

        // マウスホイールで拡大縮小
        paperRef.current.addEventListener("wheel", handleWheelZoom);

        console.log("Paper initialized:", paperInstance.current);

        return () => {
            paperRef.current?.removeEventListener("wheel", handleWheelZoom);
        };
    }, []);

    // マウスホイールでズーム
    const handleWheelZoom = (event: WheelEvent) => {
        if (!paperInstance.current) return;
        event.preventDefault();
        const delta = event.deltaY < 0 ? 1.2 : 1 / 1.2; // ホイール上で拡大、下で縮小
        const newZoom = zoomLevel * delta;
        paperInstance.current.scale(newZoom);
        setZoomLevel(newZoom);
    };

    // ノード追加処理
    const addNode = (shape: string) => {
        if (!graphRef.current) {
            console.log("Graph is not initialized!");
            return;
        }

        let node: joint.dia.Element; // 型を明示的に指定
        let defaultColor = "lightblue"; // デフォルトの色を決める

        switch (shape) {
            case "MATERIAL":
                node = new joint.shapes.standard.Circle();
                node.resize(80, 80);
                node.position(50, 50);
                defaultColor = "lightblue";
                node.attr({ body: { fill: "lightblue" }, label: { text: "material", fill: "black" } });
                break;
            case "CONDITION":
                node = new joint.shapes.standard.Polygon();
                node.position(50, 100);
                node.resize(80, 80);
                defaultColor = "lightblue";
                node.attr({
                    body: { fill: "lightblue", refPoints: "50,0 100,38 82,100 18,100 0,38" },
                    label: { text: "condition", fill: "black" }
                });
                break;
            case "RESULT":
                node = new joint.shapes.standard.Rectangle();
                node.resize(80, 80);
                node.position(250, 250);
                defaultColor = "lightblue";
                node.attr({ body: { fill: "lightblue" }, label: { text: "result", fill: "black" } });
                break;
            case "TRANSITION":
                node = new joint.shapes.standard.Rectangle();
                node.resize(20, 120);
                node.position(150, 150);
                defaultColor = "black";
                node.attr({ body: { fill: "black" }, label: { text: "transition", fill: "white" } });
                break;
            default:
                return;
        }

        node.set("defaultColor", defaultColor); // ノードにデフォルトの色を保持させる

        graphRef.current.addCell(node);
        //console.log("Added node ID:", node.id);

        setNodes((prevNodes) => [...prevNodes, { id: node.id.toString(), label: shape }]);
    };

    // ノードのハイライト（色変更）
    const highlightNode = (nodeId: string | null, isSource: boolean) => {
        if (!graphRef.current) return;

        graphRef.current.getCells().forEach((cell) => {
            if (cell.isElement()) {
                const element = cell as joint.dia.Element;
                const elementId = element.get("id")
                const defaultColor = element.get("defaultColor") || "lightblue"; // 形に応じたデフォルトの色を取得
                if (element.id === nodeId) {
                    // element.attr("body/fill", isSource ? "orange" : "lightgreen"); // Sourceならオレンジ、Targetならライトグリーン
                    element.attr("body/fill", "red" ); // red
                } else {
                    element.attr("body/fill", defaultColor); // それ以外は元の色
                }
            }
        });
    };

    // ARC作成のためのプルダウン選択時のハンドラー（SOURCE）
    const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSource(e.target.value);
        highlightNode(e.target.value, true);
    };

    // ARC作成のためのプルダウン選択時のハンドラー（TARGET）
    const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setTarget(e.target.value);
        highlightNode(e.target.value, false);
    };

    // ノード選択時のハンドラー
    const handleNodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedNode(e.target.value);
        highlightNode(e.target.value, false);
    };

    // ARC選択時のハンドラー
    const handleARCChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSelectedLink = e.target.value;

        if (!graphRef.current) return;

        // 以前の選択されたARCの色を黒に戻す
        if (selectedLink) {
            const prevLink = graphRef.current.getCell(selectedLink) as joint.dia.Link;
            if (prevLink) {
                prevLink.attr("line/stroke", "black");
                prevLink.attr("line/targetMarker/fill", "black");
            }
        }

        setSelectedLink(newSelectedLink);

        if (!newSelectedLink) return; // 何も選択されていなければ終了

        const link = graphRef.current.getCell(newSelectedLink) as joint.dia.Link;
        if (!link) return;

        // 新しく選択したARCを赤くする
        link.attr("line/stroke", "red");
        link.attr("line/targetMarker/fill", "red");
    };

    // ARC追加処理
    const addLink = () => {
        if (!graphRef.current || !source || !target) {
            console.log("Invalid source or target");
            return;
        }

        const link = new joint.shapes.standard.Link();
        link.source({ id: source });
        link.target({ id: target });
        link.attr({
            line: {
                stroke: "black",
                strokeWidth: 2,
                targetMarker: {
                    type: "path",
                    d: "M 10 -5 0 0 10 5 Z",
                    fill: "black",
                },
            },
        });

        graphRef.current.addCell(link);
        //console.log(`Link added: ${source} → ${target}`);
        setLinks((prevLinks) => [...prevLinks, { id: link.id.toString(), source, target }]);
        
        // ノードの色を元に戻す
        setTimeout(() => {
            highlightNode(null, false); // すべてのノードの色をデフォルトに戻す
        }, 500); // 500ms 待ってから元の色に戻す

        // プルダウンの選択を初期化
        setSource("");
        setTarget("");
    };

    // ノード削除処理
    const removeNode = () => {
        if (!graphRef.current || !selectedNode) return;

        const node = graphRef.current.getCell(selectedNode) as joint.dia.Element;
        if (!node) return;

        // ノードに接続しているリンクも削除
        const connectedLinks = graphRef.current.getConnectedLinks(node);
        graphRef.current.removeCells([node, ...connectedLinks]);

        // ステート更新
        setNodes((prevNodes) => prevNodes.filter((n) => n.id !== selectedNode));
        setLinks((prevLinks) => prevLinks.filter((l) => l.source !== selectedNode && l.target !== selectedNode));
        setSelectedNode(""); // 選択をリセット
    };

    // ARC削除処理
    const removeLink = () => {
        if (!graphRef.current || !selectedLink) return;

        const link = graphRef.current.getCell(selectedLink);


        if (link) {
            graphRef.current.removeCells([link]);
            setLinks((prevLinks) => prevLinks.filter((l) => l.id !== selectedLink));
            setSelectedLink(""); // 削除後は選択をリセット
        }
    };

    // 図からPNMLデータへ変換
    const generatePNML = () => {
        const xmlDoc = document.implementation.createDocument("", "", null);

        const pnml = xmlDoc.createElement("pnml");
        pnml.setAttribute("id", "defPnml");

        // UUIDを生成して追加
        const uuidElement = xmlDoc.createElement("uuid");
        uuidElement.textContent = uuidv4(); // UUID v4 を生成
        pnml.appendChild(uuidElement);

        // グローバル要素のコンテンツ
        const name = xmlDoc.createElement("name");
        const description = xmlDoc.createElement("description");
        const annotation = xmlDoc.createElement("annotation");

        pnml.appendChild(name);
        pnml.appendChild(description);
        pnml.appendChild(annotation);

        // ノードデータを元に place → transition の順に追加
        const placeElements: Element[] = [];
        const transitionElements: Element[] = [];

        nodes.forEach((node) => {
            let id = "def";
            if (node.label === "MATERIAL" || node.label === "CONDITION" || node.label === "RESULT") {
                // Place ノード
                const place = xmlDoc.createElement("place");
                if (node.label === "MATERIAL") {
                    id = id + "m" + node.id;
                } else if (node.label === "RESULT") {
                    id = id + "r" + node.id;
                } else if (node.label === "CONDITION") {
                    id = id + "c" + node.id;
                }
                place.setAttribute("id", node.id);

                //const placeName = xmlDoc.createElement("name");
                //place.appendChild(placeName);
                placeElements.push(place);
            } else if (node.label === "TRANSITION") {
                // Transition ノード
                const transition = xmlDoc.createElement("transition");
                transition.setAttribute("id", node.id);

                //const transitionName = xmlDoc.createElement("name");
                //transition.appendChild(transitionName);
                transitionElements.push(transition);
            }
        });

        // placeを追加
        placeElements.forEach((place) => pnml.appendChild(place));

        // transitionを追加
        transitionElements.forEach((transition) => pnml.appendChild(transition));

        // arcを追加
        links.forEach((link) => {
            const arc = xmlDoc.createElement("arc");
            arc.setAttribute("id", link.id);
            arc.setAttribute("source", link.source);
            arc.setAttribute("target", link.target);

            pnml.appendChild(arc);
        });

        xmlDoc.appendChild(pnml);

        // XMLを文字列に変換
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);

        return xmlString;
    };

    // template要素を生成
    const createTemplateElement = (xmlDoc: any, type: string, node: any) => {
        const id = `def${type[0]}${node.id}`; // "m", "c", "r" の接尾辞を追加
        const template = xmlDoc.createElement(`${type}Template`);
        template.setAttribute("id", id);

        // UUIDを生成して追加
        const uuidElement = xmlDoc.createElement("uuid");
        uuidElement.textContent = uuidv4();
        template.appendChild(uuidElement);

        // placeRef を追加
        const ref = xmlDoc.createElement("placeRef");
        ref.setAttribute("id", `pref_${id}`);
        ref.setAttribute("ref", node.id);
        template.appendChild(ref);

        return template;
    };

    // 図からmethodデータへ変換
    const generateMethod = () => {
        const xmlDoc = document.implementation.createDocument("", "", null);

        const pnml = xmlDoc.createElement("pnml");
        pnml.setAttribute("id", "defPnml");

        // UUIDを生成して追加
        const uuidElement = xmlDoc.createElement("uuid");
        uuidElement.textContent = uuidv4(); // UUID v4 を生成
        pnml.appendChild(uuidElement);

        // グローバル要素のコンテンツ
        const name = xmlDoc.createElement("name");
        const description = xmlDoc.createElement("description");
        const annotation = xmlDoc.createElement("annotation");
        pnml.appendChild(name);
        pnml.appendChild(description);
        pnml.appendChild(annotation);

        // ノードデータを元に place → transition の順に追加
        const placeElements: Element[] = [];
        const transitionElements: Element[] = [];

        // templateも作成する
        const materialTemplateElements: Element[] = [];
        const conditionTemplateElements: Element[] = [];
        const resultTemplateElements: Element[] = [];
        // instructionも作成する
        const instructionElements: Element[] = [];

        nodes.forEach((node) => {
            let id = "def";
            if (node.label === "MATERIAL" || node.label === "CONDITION" || node.label === "RESULT") {
                // Place ノード
                const place = xmlDoc.createElement("place");
                place.setAttribute("id", node.id);
                //const placeName = xmlDoc.createElement("name");
                //place.appendChild(placeName);
                placeElements.push(place);

                // ノードの種類に応じてtemplateのリストに追加
                switch (node.label) {
                    case "MATERIAL":
                        materialTemplateElements.push(createTemplateElement(xmlDoc, "material", node));
                        break;
                    case "CONDITION":
                        conditionTemplateElements.push(createTemplateElement(xmlDoc, "condition", node));
                        break;
                    case "RESULT":
                        resultTemplateElements.push(createTemplateElement(xmlDoc, "result", node));
                        break;
                }

            } else if (node.label === "TRANSITION") {
                // Transition ノード
                const transition = xmlDoc.createElement("transition");
                transition.setAttribute("id", node.id);
                //const transitionName = xmlDoc.createElement("name");
                //transition.appendChild(transitionName);
                transitionElements.push(transition);

                // instructionを追加
                const instruction = xmlDoc.createElement("instruction");
                instruction.setAttribute("id", "instID_"+node.id);
                // UUIDを生成して追加
                const iuuidElement = xmlDoc.createElement("uuid");
                iuuidElement.textContent = uuidv4(); // UUID v4 を生成
                instruction.appendChild(iuuidElement);
                const tref = xmlDoc.createElement("transisionRef");
                tref.setAttribute("id", "tref_"+node.id);
                tref.setAttribute("ref", node.id);
                instruction.appendChild(tref);
                instructionElements.push(instruction);
            }
        });

        // placeを追加
        placeElements.forEach((place) => pnml.appendChild(place));

        // transitionを追加
        transitionElements.forEach((transition) => pnml.appendChild(transition));

        // arcを追加
        links.forEach((link) => {
            const arc = xmlDoc.createElement("arc");
            arc.setAttribute("id", link.id);
            arc.setAttribute("source", link.source);
            arc.setAttribute("target", link.target);

            pnml.appendChild(arc);
        });
        
        // methodデータを追加
        const method = xmlDoc.createElement("method");
        method.setAttribute("id", "defMethod");
        // UUIDを生成して追加
        const muuidElement = xmlDoc.createElement("uuid");
        muuidElement.textContent = uuidv4(); // UUID v4 を生成
        method.appendChild(muuidElement);
        
        const methodName = xmlDoc.createElement("name");
        const methodDescription = xmlDoc.createElement("description");
        const methodAnnotation = xmlDoc.createElement("annotation");
        method.appendChild(methodName);
        method.appendChild(methodDescription);
        method.appendChild(methodAnnotation);
        
        // pnmlを追加
        method.appendChild(pnml);

        // programを追加
        const program = xmlDoc.createElement("program");
        program.setAttribute("id", "defProgram");
        // UUIDを生成して追加
        const puuidElement = xmlDoc.createElement("uuid");
        puuidElement.textContent = uuidv4(); // UUID v4 を生成
        program.appendChild(puuidElement);

        const programName = xmlDoc.createElement("name");
        const programDescription = xmlDoc.createElement("description");
        const programAnnotation = xmlDoc.createElement("annotation");
        program.appendChild(programName);
        program.appendChild(programDescription);
        program.appendChild(programAnnotation);

        // instructionを追加
        instructionElements.forEach((instruction) => program.appendChild(instruction));

        // templateを追加
        materialTemplateElements.forEach((materialT) => program.appendChild(materialT));
        conditionTemplateElements.forEach((conditionT) => program.appendChild(conditionT));
        resultTemplateElements.forEach((resultT) => program.appendChild(resultT));

        method.appendChild(program);
        xmlDoc.appendChild(method);

        // XMLを文字列に変換
        const serializer = new XMLSerializer();
        const xmlString = serializer.serializeToString(xmlDoc);

        return xmlString;
    };

    // XMLデータ(pnml only)をダウンロード
    const downloadPNML = () => {
        const xmlString = generatePNML();
        const blob = new Blob([xmlString], { type: "application/xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "petri_net.xml";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // XMLデータをダウンロード
    const downloadXML = () => {
        const xmlString = generateMethod();
        const blob = new Blob([xmlString], { type: "application/xml" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "petri_net.xml";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // XMLデータをインポート
    //const [graph, setGraph] = useState<joint.dia.Graph | null>(null);
    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];
        if (!file) return;
        // メモリに存在しているノード、ARCを削除
        setNodes([])
        setLinks([])

        const reader = new FileReader();
        reader.onload = (e) => {
            const parser = new DOMParser();
            if (e.target && typeof e.target.result === "string") {
                const xmlDoc = parser.parseFromString(e.target.result, "text/xml");
                loadPetriNetFromXML(xmlDoc);
            }
            //loadPetriNetFromXML(xmlDoc);
        };
        reader.readAsText(file);
    };

    const loadPetriNetFromXML = (xmlDoc:any) => {
        if (!graphRef.current) return;
        graphRef.current.clear();

        const places = xmlDoc.getElementsByTagName("place");
        const transitions = xmlDoc.getElementsByTagName("transition");
        const arcs = xmlDoc.getElementsByTagName("arc");
        const mtemplates = xmlDoc.getElementsByTagName("materialTemplate");
        const ctemplates = xmlDoc.getElementsByTagName("conditionTemplate");
        const rtemplates = xmlDoc.getElementsByTagName("resultTemplate");

        const mplacelist: String[] = [];
        Array.from(mtemplates).forEach((mtemplate, index) => {
            const prefs = (mtemplate as Element).getElementsByTagName("placeRef");
            Array.from(prefs).forEach((pref) => {
                const prefid = pref.getAttribute("ref");
                if (prefid) {
                    mplacelist.push(prefid);
                }
            }
        )});
        const cplacelist: String[] = [];
        Array.from(ctemplates).forEach((ctemplate, index) => {
            const prefs = (ctemplate as Element).getElementsByTagName("placeRef");
            Array.from(prefs).forEach((pref) => {
                const prefid = pref.getAttribute("ref");
                if (prefid) {
                    cplacelist.push(prefid);
                }
            }
            )
        });
        const rplacelist: String[] = [];
        Array.from(rtemplates).forEach((rtemplate, index) => {
            const prefs = (rtemplate as Element).getElementsByTagName("placeRef");
            Array.from(prefs).forEach((pref) => {
                const prefid = pref.getAttribute("ref");
                if (prefid) {
                    rplacelist.push(prefid);
                }
            }
            )
        });

        const nodes: { [key: string]: joint.dia.Element } = {};

        // Places
        Array.from(places).forEach((place, index) => {
            let shape = 'MATERIAL'
            const defaultColor = "lightblue"
            const id = (place as Element).getAttribute("id");
            let node;
            // templateの判別
            if (id && mplacelist.includes(id)){
                const materialAttrs = {
                    body: { 
                        fill: defaultColor,  // 色
                        //stroke: "darkgreen",  // 枠の色
                        //"stroke-width": 1  // 枠線の太さ
                    },
                    label: { 
                        text: id || "No ID" ,  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                };
                node = new joint.shapes.standard.Circle({
                    id: id,
                    position: { x: 100 + index * 100, y: 100 },
                    size: { width: 80, height: 80 },
                    attrs: materialAttrs
                });
            } else if(id && cplacelist.includes(id)) {
                shape = "CONDITION"
                const conditionAttrs ={
                    body: {
                        fill: defaultColor,  // ポリゴンの色
                        refPoints: "40,0 80,30 64,80 16,80 0,30",  // ポリゴンの頂点座標
                    },
                    label: {
                        text: id || 'No ID',  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                }
                node = new joint.shapes.standard.Polygon({
                    id: id,
                    position: { x: 100 + index * 100, y: 200 },  // ノードの位置
                    size: { width: 80, height: 80 },  // ノードのサイズ
                    attrs: conditionAttrs
                });
            } else if (id && rplacelist.includes(id)) {
                shape = "RESULT"
                const resultAttrs = {
                    body: {
                        fill: defaultColor,  // 色
                    },
                    label: {
                        text: id || 'No ID',  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                }
                node = new joint.shapes.standard.Rectangle({
                    id: id,
                    position: { x: 100 + index * 100, y: 200 },  // ノードの位置
                    size: { width: 80, height: 80 },  // ノードのサイズ
                    attrs: resultAttrs
                });
            }else{
                const nonAttrs = {
                    body: {
                        fill: "gray",  // 色
                        //stroke: "darkgreen",  // 枠の色
                        //"stroke-width": 1  // 枠線の太さ
                    },
                    label: {
                        text: id || "No ID",  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                };
                node = new joint.shapes.standard.Circle({
                    id: id,
                    position: { x: 100 + index * 100, y: 100 },
                    size: { width: 80, height: 80 },
                    attrs: nonAttrs
                });
                node.set("defaultColor", defaultColor); // ノードにデフォルトの色を保持させる
            }
            if (node) {
                graphRef.current.addCell(node);
                if (id) {
                    nodes[id] = node;
                }
                setNodes((prevNodes) => [...prevNodes, { id: id || "", label: shape }]);
            }
        });

        // Transitions
        Array.from(transitions).forEach((transition, index) => {
            let shape = "TRANSITION"
            const defaultColor = "black"
            const id = (transition as Element).getAttribute("id");
            const transAttrs = {
                body: {
                    fill: defaultColor,  // 色
                },
                label: {
                    text: id || 'No ID',  // ラベルのテキスト
                    fill: "black",  // ラベルの文字色
                    fontSize: 5  // ラベルのフォントサイズ
                }
            }
            //const node = new shapes.pn.Transition({
            const node = new joint.shapes.standard.Rectangle({
                    position: { x: 100 + index * 100, y: 200 },  // ノードの位置
                    size: { width: 20, height: 120 },  // ノードのサイズ
                    attrs: transAttrs
                });
            node.set("defaultColor", defaultColor); // ノードにデフォルトの色を保持させる
            node.set("id", id); // ノードにidを保持させる

            graphRef.current.addCell(node);
            if (id) {
                nodes[id] = node;
            }
            setNodes((prevNodes) => [...prevNodes, { id: node.id.toString(), label: shape }]);
        });

        // Arcs
        Array.from(arcs).forEach((arc) => {
            const source = (arc as Element).getAttribute("source");
            const target = (arc as Element).getAttribute("target");
            if (source && target && nodes[source] && nodes[target]) {
                const link = new joint.shapes.standard.Link({
                    source: { id: nodes[source].id },
                    target: { id: nodes[target].id },
                    line: {
                        stroke: "black",
                        strokeWidth: 2,
                        targetMarker: {
                            type: "path",
                            d: "M 10 -5 0 0 10 5 Z",
                            fill: "black",
                        },
                    },
                });
                graphRef.current.addCell(link);
                setLinks((prevLinks) => [...prevLinks, { id: link.id.toString(), source, target }]);
            }
        });
    };


    return (
        <>
            <h1 style={{ textAlign: "center", color: "#333", marginBottom: "20px" }}>
                Petri Net Diagram Editor
            </h1>
            <div className="divParent">
                {/* ファイルアップロード */}
                <div className="div-area">
                    <h4>Upload MaiML / XML</h4>
                    <input
                        type="file"
                        onChange={(event) => handleFileUpload(event)}
                        accept=".xml,.maiml"
                    />
                </div>

                {/* Add Node & Create ARC を横並び */}
                <div className="div-row">
                    {/* ノード追加ボタン */}
                    <div className="div-area">
                        <h4>Add PLACE / TRANSITION</h4>
                        <button onClick={() => addNode("MATERIAL")}>PLACE of Material</button>
                        <button onClick={() => addNode("CONDITION")}>PLACE of Condition</button>
                        <br/>
                        <button onClick={() => addNode("TRANSITION")}>Transition</button>
                        <button onClick={() => addNode("RESULT")}>PLACE of Result</button>
                    </div>

                    {/* ARCを追加 */}
                    <div className="div-area">
                        <h4>Add ARC</h4>
                        <label>SOURCE:</label>
                        <select value={source} onChange={handleSourceChange}>
                            <option value="">Select source</option>
                            {nodes.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.label} ({node.id})
                                </option>
                            ))}
                        </select>
                        <br/>
                        <label>TARGET:</label>
                        <select value={target} onChange={handleTargetChange}>
                            <option value="">Select target</option>
                            {nodes.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.label} ({node.id})
                                </option>
                            ))}
                        </select>
                        <br />
                        <button onClick={addLink} style={{ backgroundColor: "#28a745" }}>
                            Create ARC
                        </button>
                    </div>
                </div>

                {/* Delete Node & Delete ARC を横並び */}
                <div className="div-row">
                    {/* ノードの削除 */}
                    <div className="div-area">
                        <h4>Delete PLACE / TRANSITION</h4>
                        <label className="label2">PLACE/TRANSITION:</label>
                        <select value={selectedNode} onChange={handleNodeChange}>
                            <option value="">Select PLACE or TRANSITION</option>
                            {nodes.map((node) => (
                                <option key={node.id} value={node.id}>
                                    {node.label} ({node.id})
                                </option>
                            ))}
                        </select>
                        <br />
                        <button onClick={removeNode} style={{ backgroundColor: "#dc3545" }}>
                            Delete PLACE/TRANSITION
                        </button>
                    </div>

                    {/* ARCの削除 */}
                    <div className="div-area">
                        <h4>Delete ARC</h4>
                        <label>ARC:</label>
                        <select value={selectedLink} onChange={handleARCChange}>
                            <option value="">Select ARC</option>
                            {links.map((link) => (
                                <option key={link.id} value={link.id}>
                                    {link.source} → {link.target}
                                </option>
                            ))}
                        </select>
                        <br />
                        <button onClick={removeLink} style={{ backgroundColor: "#dc3545" }}>
                            Delete ARC
                        </button>
                    </div>
                </div>

                {/* JointJSの描画エリア */}
                <div className="drawarea" ref={paperRef} />
            </div>

            {/* XMLデータ生成&ダウンロード */}
            <div className="button-row">
                <button onClick={downloadPNML} className="xml-button">
                    Create XML &lt;pnml&gt; Data
                </button>
                <button onClick={downloadXML} className="xml-button">
                    Create XML &lt;method&gt; Data
                </button>
            </div>
        </>
    );
};

export default FlowEditor;
