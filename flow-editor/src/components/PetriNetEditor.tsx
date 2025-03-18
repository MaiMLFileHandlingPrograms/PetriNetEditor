import React, { useState, useEffect } from "react";
import { dia, shapes } from "jointjs";

const PetriNetEditor = (props : any) => {
    const [graph, setGraph] = useState<dia.Graph | null>(null);
    const [paper, setPaper] = useState<dia.Paper | null>(null);
    
    useEffect(() => {
        const newGraph = new dia.Graph();
        setGraph(newGraph);

        const newPaper = new dia.Paper({
            el: document.getElementById("paper") || undefined,
            model: newGraph,
            width: 800,
            height: 600,
            gridSize: 10,
            drawGrid: true,
            interactive: { linkMove: false },
        });
        setPaper(newPaper);
    }, []);
    /*
    const addPlace = () => {
        if (!graph) return;
        const place = new shapes.pn.Place({
            position: { x: 100, y: 100 },
            attrs: { ".label": { text: "P" } },
        });
        graph.addCell(place);
    };
    
    const addTransition = () => {
        if (!graph) return;
        const transition = new shapes.pn.Transition({
            position: { x: 200, y: 100 },
            attrs: { ".label": { text: "T" } },
        });
        graph.addCell(transition);
    };
    
    const addArc = () => {
        if (!graph) return;
        const elements = graph.getElements();
        if (elements.length < 2) return;
        const link = new shapes.pn.Link({
            source: { id: elements[0].id },
            target: { id: elements[1].id },
        });
        graph.addCell(link);
    };
    */

    const handleFileUpload = (event: any) => {
        const file = event.target.files[0];
        if (!file) return;

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
        if (!props.graph) return;
        //props.graph.clear();

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
                console.log(prefid)
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
                console.log(prefid)
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
                console.log(prefid)
                if (prefid) {
                    rplacelist.push(prefid);
                }
            }
            )
        });

        const nodes: { [key: string]: dia.Element } = {};

        // Places
        Array.from(places).forEach((place, index) => {
            const id = (place as Element).getAttribute("id");
            let node;
            // templateの判別
            if (id && mplacelist.includes(id)){
                const materialAttrs = {
                    body: { 
                        fill: "lightblue",  // 色
                        //stroke: "darkgreen",  // 枠の色
                        //"stroke-width": 1  // 枠線の太さ
                    },
                    label: { 
                        text: id || "No ID" ,  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                };
                node = new shapes.standard.Circle({
                    position: { x: 100 + index * 100, y: 100 },
                    size: { width: 80, height: 80 },
                    attrs: materialAttrs
                });
            } else if(id && cplacelist.includes(id)) {
                const conditionAttrs ={
                    body: {
                        fill: "lightblue",  // ポリゴンの色
                        refPoints: "40,0 80,30 64,80 16,80 0,30",  // ポリゴンの頂点座標
                    },
                    label: {
                        text: id || 'No ID',  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                }
                node = new shapes.standard.Polygon({
                    position: { x: 100 + index * 100, y: 200 },  // ノードの位置
                    size: { width: 80, height: 80 },  // ノードのサイズ
                    attrs: conditionAttrs
                });
            } else if (id && rplacelist.includes(id)) {
                const resultAttrs = {
                    body: {
                        fill: "lightblue",  // 色
                    },
                    label: {
                        text: id || 'No ID',  // ラベルのテキスト
                        fill: "black",  // ラベルの文字色
                        fontSize: 5  // ラベルのフォントサイズ
                    }
                }
                node = new shapes.standard.Rectangle({
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
                node = new shapes.standard.Circle({
                    position: { x: 100 + index * 100, y: 100 },
                    size: { width: 80, height: 80 },
                    attrs: nonAttrs
                });
            }
            if (node) {
                props.graph.addCell(node);
            }
            if (id && node) {
                nodes[id] = node;
            }
        });

        // Transitions
        Array.from(transitions).forEach((transition, index) => {
            const id = (transition as Element).getAttribute("id");
            const transAttrs = {
                body: {
                    fill: "black",  // 色
                },
                label: {
                    text: id || 'No ID',  // ラベルのテキスト
                    fill: "black",  // ラベルの文字色
                    fontSize: 5  // ラベルのフォントサイズ
                }
            }
            //const node = new shapes.pn.Transition({
            const node = new shapes.standard.Rectangle({
                    position: { x: 100 + index * 100, y: 200 },  // ノードの位置
                    size: { width: 20, height: 120 },  // ノードのサイズ
                    attrs: transAttrs
                });
            props.graph.addCell(node);
            if (id) {
                nodes[id] = node;
            }
        });
        // Arcs
        Array.from(arcs).forEach((arc) => {
            const source = (arc as Element).getAttribute("source");
            const target = (arc as Element).getAttribute("target");
            if (source && target && nodes[source] && nodes[target]) {
                const link = new shapes.standard.Link({
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
                props.graph.addCell(link);
            }
        });
    };

    return (
        <div>
            <input type="file" onChange={(event) => handleFileUpload(event)} accept=".xml,.maiml" />
            
            {/*<button onClick={addPlace}>Add Place</button>
            <button onClick={addTransition}>Add Transition</button>
            <button onClick={addArc}>Add Arc</button>
            */}

            <div id="paper" style={{ border: "1px solid black", marginTop: "10px" }}></div>
        </div>
    );
};

export default PetriNetEditor;

