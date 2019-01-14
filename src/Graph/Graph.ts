import * as d3 from 'd3';
import {Node, INode, INodeDatum} from "./Node";
import {Selection} from 'd3-selection';
import {BaseType, Simulation} from "d3";
import Link, {ILinkDatum} from "./Link";
import NodeCollection from "./NodeCollection";
import {LinkCollection} from "./LinkCollection";
import {merge} from "rxjs";

interface IGraphConfiguration {
    links: ILinkDatum[];
    containerElement?: Element,
    containerSelector?: string,
    height: number,
    width: number,
    nodes: INodeDatum[]
}

export default class Graph {
    private rootContainer: Selection<Element, any, HTMLElement | null, undefined>;
    private svgContainer: Selection<SVGSVGElement, any, HTMLElement | null, undefined>;
    private readonly width: number;
    private readonly height: number;
    private readonly simulation: Simulation<INodeDatum, undefined>;
    private links: LinkCollection;
    private nodes: NodeCollection;
    private containerG: Selection<SVGGElement, any, HTMLElement | null, undefined>;
    private linkContainer: Selection<SVGLineElement, any, BaseType, any>;
    private nodeContainer: Selection<SVGCircleElement, any, BaseType, any>;

    constructor(configuration: IGraphConfiguration) {

        if (configuration.containerElement) {
            this.rootContainer = d3.select(configuration.containerElement);
        } else if (configuration.containerSelector) {
            this.rootContainer = d3.select(configuration.containerSelector)
        } else {
            throw console.error(new Error('`configuration.containerElement` or `configuration.containerSelector` must be set'))
        }

        if (configuration.width) {
            this.width = configuration.width;
        } else {
            throw console.error(new Error('`configuration.width` must be set'))
        }

        if (configuration.height) {
            this.height = configuration.height;
        } else {
            throw console.error(new Error('`configuration.height` must be set'))
        }

        if (configuration.links) {
            this.links = new LinkCollection({
                pureCollection: configuration.links.map((linkDatum) => new Link({
                    linkDatum
                }))
            })
        } else {
            this.links = new LinkCollection({})
        }

        if (configuration.nodes) {
            this.nodes = new NodeCollection({
                pureCollection: configuration.nodes.map((nodeDatum) => new Node({
                    nodeDatum
                }))
            })
        } else {
            this.nodes = new NodeCollection({})
        }

        // SETTINGS END ---

        this.svgContainer = this.rootContainer
            .append("div")
            .classed("svg-container", true)
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .classed("svg-content-responsive", true);

        this.containerG = this.svgContainer
            .append("g")
            .attr("transform", "translate(" + configuration.width / 2 + "," + configuration.height / 2 + ")");
        this.linkContainer = this.containerG.append("g").attr("stroke", "#000").attr("stroke-width", 1.5).selectAll(".link");
        this.nodeContainer = this.containerG.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5).selectAll(".node");
        this.simulation = d3.forceSimulation(this.nodes.toArray())
            .force("charge", d3.forceManyBody().strength(-1000))
            .force("link", d3.forceLink<INodeDatum, ILinkDatum>(configuration.links).distance(200).id((d) => d.id))
            .force("x", d3.forceX())
            .force("y", d3.forceY())
            .alphaTarget(1)
            .on("tick", this.ticked.bind(this));
        this.restart();
        merge(this.nodes.onChange, this.links.onChange)
            .subscribe(()=> {
                console.log('RESTARTING');
                this.restart()
            } )
    }

    private restart() {
        const {getColor} = this;
        // Apply the general update pattern to the nodes.
        this.nodeContainer = this.nodeContainer
            .data(this.nodes.toArray(), function (d) {
                return d.id;
            });
        this.nodeContainer.exit().remove();
        this.nodeContainer = this.nodeContainer
            .enter()
            .append("circle")
            .attr("fill", function(d) { return getColor(d.id); })
            .attr("r", 8)
            .merge(this.nodeContainer)
            .call(this.onDrag(this.simulation));

        // Apply the general update pattern to the links.
        this.linkContainer = this.linkContainer.data(this.links.toArray());
        this.linkContainer.exit().remove();
        this.linkContainer = this.linkContainer.enter().append("line")
            .attr("stroke", function(d) { return getColor(d.value); })
            .merge(this.linkContainer);

        // Update and restart the simulation.
        this.simulation.nodes(this.nodes.toArray());
        this.simulation
            .force("link", d3.forceLink<INodeDatum, ILinkDatum>(this.links.toArray()).distance(200).id(d=>d.id))

        this.simulation.alpha(1).restart();
    }

    ticked() {
        this.nodeContainer.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; })

        this.linkContainer
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });
    }

    // OOP Methods
    getColor = d3.scaleOrdinal(d3.schemeCategory10);

    onDrag(simulation: d3.Simulation<any, undefined>) {

        function dragstarted(d: { fx: any; x: any; fy: any; y: any; }) {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(d: { fx: any; fy: any; }) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
        }

        function dragended(d: { fx: null; fy: null; }) {
            if (!d3.event.active) simulation.alphaTarget(0);
            // d.fx = null;
            // d.fy = null;
        }

        return d3.drag()
        // @ts-ignore
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    addNode(nodeDatum: INodeDatum): Node {
        const node = new Node({nodeDatum});
        this.nodes.add(node);
        return node;
    }
    removeNode(node:Node){
        this.nodes.remove(node);
    }

    addLink(linkDatum: ILinkDatum): Link {
        const link = new Link({ linkDatum });
        this.links.add(link);
        return link;
    }
    removeLink(link:Link){
        this.links.remove(link);
    }

    UNSAFE_restart = this.restart
}