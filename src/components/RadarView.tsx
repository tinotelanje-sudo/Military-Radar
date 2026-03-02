import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { RadarObject } from '../types';

interface RadarViewProps {
  objects: RadarObject[];
}

export const RadarView: React.FC<RadarViewProps> = ({ objects }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const radius = Math.min(width, height) / 2 - 40;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('background', '#050505');

    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    // Draw grid rings
    const rings = [0.2, 0.4, 0.6, 0.8, 1];
    rings.forEach(r => {
      g.append('circle')
        .attr('r', r * radius)
        .attr('fill', 'none')
        .attr('stroke', '#00FF00')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '4,4');
      
      g.append('text')
        .attr('y', -r * radius - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#00FF00')
        .attr('font-size', '10px')
        .attr('opacity', 0.5)
        .text(`${Math.round(r * 100)}km`);
    });

    // Draw axis lines
    for (let i = 0; i < 360; i += 45) {
      const angle = (i * Math.PI) / 180;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', Math.cos(angle) * radius)
        .attr('y2', Math.sin(angle) * radius)
        .attr('stroke', '#00FF00')
        .attr('stroke-opacity', 0.1);
    }

    // Draw sweep line
    const sweep = g.append('line')
      .attr('class', 'sweep')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', radius)
      .attr('y2', 0)
      .attr('stroke', '#00FF00')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8);

    const animateSweep = () => {
      sweep.transition()
        .duration(4000)
        .ease(d3.easeLinear)
        .attrTween('transform', () => {
          return d3.interpolateString('rotate(0)', 'rotate(360)');
        })
        .on('end', animateSweep);
    };
    animateSweep();

    // Draw objects
    const objectGroups = g.selectAll('.object')
      .data(objects, (d: any) => d.id)
      .enter()
      .append('g')
      .attr('class', 'object')
      .attr('transform', d => {
        const r = (d.distance / 100) * radius;
        const a = (d.angle * Math.PI) / 180;
        return `translate(${r * Math.cos(a)}, ${r * Math.sin(a)})`;
      });

    objectGroups.append('circle')
      .attr('r', 6)
      .attr('fill', d => {
        if (d.classification === 'Aircraft') return '#FF0000';
        if (d.classification === 'Drone') return '#FFFF00';
        return '#00FF00';
      })
      .attr('filter', 'drop-shadow(0 0 5px currentColor)');

    objectGroups.append('text')
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#FFFFFF')
      .attr('font-size', '10px')
      .text(d => d.classification || 'Detecting...');

  }, [objects]);

  return (
    <div className="relative w-full aspect-square max-w-[600px] mx-auto bg-black rounded-full overflow-hidden border-4 border-zinc-800 shadow-2xl">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-mono text-green-500/50 uppercase tracking-widest">
        Radar System Active
      </div>
    </div>
  );
};
