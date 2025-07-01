import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Person } from '../types';
import { TreeNodeCard } from './TreeNodeCard';

const TREE_NODE_WIDTH = 140;
const TREE_NODE_HEIGHT = 60;
const GEN_VERT_SPACING = 100; 
const SIBLING_HORIZ_SPACING = 40; 
const SPOUSE_OFFSET_X = TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING;

interface LayoutNode extends Person {
  x: number;
  y: number;
  isRoot?: boolean;
  isSpouse?: boolean;
  isParent?: boolean;
  isChild?: boolean;
  isSibling?: boolean;
}

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  key: string;
  type: 'parent-child' | 'spouse' | 'sibling-branch';
}

interface FamilyTreeGraphProps {
  people: Person[]; // All people in the dataset
  rootPersonId: string;
  getPersonById: (id: string) => Person | undefined;
  getChildrenOf: (personId: string) => Person[]; // To find siblings via parents
  onNodeClick: (person: Person) => void;
  onNodeDoubleClick?: (person: Person) => void; // New prop
}

export const FamilyTreeGraph: React.FC<FamilyTreeGraphProps> = ({
  people,
  rootPersonId,
  getPersonById,
  getChildrenOf,
  onNodeClick,
  onNodeDoubleClick, // Destructure new prop
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });

  const { layoutNodes, lines } = useMemo(() => {
    const nodes: LayoutNode[] = [];
    const newLines: Line[] = [];
    if (!rootPersonId) return { layoutNodes: [], lines: [] };

    const rootPerson = getPersonById(rootPersonId);
    if (!rootPerson) return { layoutNodes: [], lines: [] };

    let minX = 0, maxX = 0, minY = 0, maxY = 0;

    const updateBounds = (x: number, y: number) => {
        minX = Math.min(minX, x - TREE_NODE_WIDTH / 2);
        maxX = Math.max(maxX, x + TREE_NODE_WIDTH / 2);
        minY = Math.min(minY, y - TREE_NODE_HEIGHT / 2);
        maxY = Math.max(maxY, y + TREE_NODE_HEIGHT / 2);
    };
    
    const logicalRootX = 0;
    const logicalRootY = 0;

    // --- PARENTS ---
    const father = rootPerson.fatherId ? getPersonById(rootPerson.fatherId) : null;
    const mother = rootPerson.motherId ? getPersonById(rootPerson.motherId) : null;
    const parentY = logicalRootY - (TREE_NODE_HEIGHT + GEN_VERT_SPACING);

    if (father) {
      const fatherX = logicalRootX - (mother ? (TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING) / 2 : 0);
      nodes.push({ ...father, x: fatherX, y: parentY, isParent: true });
      newLines.push({ x1: fatherX, y1: parentY, x2: logicalRootX, y2: logicalRootY, key: `p-${father.id}-${rootPerson.id}`, type: 'parent-child' });
      updateBounds(fatherX, parentY);
      if (mother) {
         const motherX = logicalRootX + (TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING) / 2;
         newLines.push({ x1: fatherX, y1: parentY, x2: motherX, y2: parentY, key: `s-${father.id}-${mother.id}`, type: 'spouse' });
      }
    }
    if (mother) {
      const motherX = logicalRootX + (father ? (TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING) / 2 : 0);
      nodes.push({ ...mother, x: motherX, y: parentY, isParent: true });
      newLines.push({ x1: motherX, y1: parentY, x2: logicalRootX, y2: logicalRootY, key: `p-${mother.id}-${rootPerson.id}`, type: 'parent-child' });
      updateBounds(motherX, parentY);
    }

    // --- ROOT AND SIBLINGS ---
    let siblings: Person[] = [];
    if (father) {
        siblings.push(...getChildrenOf(father.id));
    }
    if (mother) {
        siblings.push(...getChildrenOf(mother.id));
    }
    // Unique siblings, excluding the root person
    const uniqueSiblingIds = new Set<string>();
    siblings = siblings.filter(s => {
        if (s.id === rootPerson.id) return false;
        if (uniqueSiblingIds.has(s.id)) return false;
        uniqueSiblingIds.add(s.id);
        return true;
    });
    
    const rootAndSiblings = [...siblings.map(s => ({...s, isSibling: true})), {...rootPerson, isRoot: true}];
    // Sort root and siblings, e.g., by birth date if available, or just keep root in middle
    // For simplicity, let's place root then siblings around it.
    // Or, just calculate total width and place them sequentially.

    const mainGenerationY = logicalRootY;
    const rootAndSiblingsCount = rootAndSiblings.length;
    const rootAndSiblingsTotalWidth = rootAndSiblingsCount * TREE_NODE_WIDTH + (rootAndSiblingsCount - 1) * SIBLING_HORIZ_SPACING;
    let currentMainGenX = logicalRootX - rootAndSiblingsTotalWidth / 2 + TREE_NODE_WIDTH / 2;
    
    // Parent connector point for siblings
    const parentMidPointX = (father && mother) ? (nodes.find(n=>n.id===father.id)!.x + nodes.find(n=>n.id===mother.id)!.x)/2 : (father ? nodes.find(n=>n.id===father.id)!.x : (mother ? nodes.find(n=>n.id===mother.id)!.x : logicalRootX));
    const siblingLineY = mainGenerationY - GEN_VERT_SPACING / 2;

    if ( (father || mother) && rootAndSiblingsCount > 0) {
         // Vertical line from parent(s) midpoint down to horizontal sibling line
        newLines.push({
            x1: parentMidPointX, y1: parentY + TREE_NODE_HEIGHT / 2,
            x2: parentMidPointX, y2: siblingLineY,
            key: `parent-sibling-connect-vert`, type: 'sibling-branch'
        });
        // Horizontal line connecting all siblings
        if (rootAndSiblingsCount > 1) {
            newLines.push({
                x1: currentMainGenX, y1: siblingLineY,
                x2: currentMainGenX + rootAndSiblingsTotalWidth - TREE_NODE_WIDTH, y2: siblingLineY,
                key: `parent-sibling-connect-horiz`, type: 'sibling-branch'
            });
        } else if (rootAndSiblingsCount === 1) { // Only root, connect parent directly to root if no horiz line
             // This is handled by parent-child lines to root if root is the only one.
             // If only root, ensure the parent line connects to its X.
             const rootNodeInArray = rootAndSiblings.find(rs => rs.id === rootPerson.id)!;
             rootNodeInArray.x = currentMainGenX; // Assign X for root
             // Adjust parent-to-root lines if root is only child shown in this generation
             newLines.filter(l => l.type === 'parent-child' && l.y2 === mainGenerationY).forEach(l => l.x2 = currentMainGenX);
        }
    }


    rootAndSiblings.forEach(rs => {
      const nodeX = currentMainGenX;
      nodes.push({ ...rs, x: nodeX, y: mainGenerationY });
      updateBounds(nodeX, mainGenerationY);
      
      // Connect this sibling/root to the horizontal sibling line
      if ( (father || mother) && rootAndSiblingsCount > 0 ) { // only draw if there's a parent and a line to connect to
          newLines.push({
              x1: nodeX, y1: siblingLineY,
              x2: nodeX, y2: mainGenerationY - TREE_NODE_HEIGHT / 2,
              key: `sibling-connect-${rs.id}`, type: 'sibling-branch'
          });
      }
      currentMainGenX += TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING;
    });
    
    // Find the root node again from the `nodes` array to get its calculated X for spouse/children positioning
    const placedRootNode = nodes.find(n => n.id === rootPerson.id)!;
    const rootDisplayX = placedRootNode.x;


    // --- SPOUSES OF ROOT ---
    const rootSpouses = rootPerson.spouseIds.map(id => getPersonById(id)).filter(Boolean) as Person[];
    rootSpouses.forEach((spouse, index) => {
      // Position spouses next to the root node, alternating sides or placing sequentially
      // For simplicity, place first spouse to the right.
      const spouseX = rootDisplayX + SPOUSE_OFFSET_X * (index + 1) ; // Simple right placement for now
      const spouseY = mainGenerationY;
      nodes.push({ ...spouse, x: spouseX, y: spouseY, isSpouse: true });
      newLines.push({ x1: rootDisplayX, y1: spouseY, x2: spouseX, y2: spouseY, key: `s-${rootPerson.id}-${spouse.id}`, type: 'spouse' });
      updateBounds(spouseX, spouseY);
    });


    // --- CHILDREN OF ROOT ---
    const children = getChildrenOf(rootPerson.id);
    const childrenY = mainGenerationY + TREE_NODE_HEIGHT + GEN_VERT_SPACING;
    const childrenTotalWidth = children.length * TREE_NODE_WIDTH + (children.length - 1) * SIBLING_HORIZ_SPACING;
    let currentChildX = rootDisplayX - childrenTotalWidth / 2 + TREE_NODE_WIDTH / 2;

    let childrenLineStartY = mainGenerationY + TREE_NODE_HEIGHT / 2;
    let childrenLineStartX = rootDisplayX; // From root's center
    
    // If root has spouses, might connect from midpoint between root and first spouse
    // For now, connect from root.

    if (children.length > 0) {
      const childrenHorizontalLineY = childrenY - GEN_VERT_SPACING / 2;
      // Vertical line from root (or root+spouse) down to children's horizontal line
      newLines.push({
          x1: childrenLineStartX, y1: childrenLineStartY, 
          x2: childrenLineStartX, y2: childrenHorizontalLineY,
          key: `rc-vert-${rootPerson.id}`, type: 'parent-child'
      });
      // Horizontal line connecting children branches
      if (children.length > 1) {
         newLines.push({
            x1: currentChildX, y1: childrenHorizontalLineY, 
            x2: currentChildX + childrenTotalWidth - TREE_NODE_WIDTH, y2: childrenHorizontalLineY,
            key: `rc-horiz-${rootPerson.id}`, type: 'parent-child'
         });
      }
    }
    
    children.forEach(child => {
      nodes.push({ ...child, x: currentChildX, y: childrenY, isChild: true });
      const childConnectorY = childrenY - GEN_VERT_SPACING / 2; // Top of the child horizontal line
      // Vertical line from child to horizontal line
      newLines.push({ 
          x1: currentChildX, y1: childConnectorY, 
          x2: currentChildX, y2: childrenY - TREE_NODE_HEIGHT / 2, 
          key: `c-${child.id}-${rootPerson.id}`, type: 'parent-child' 
      });
      updateBounds(currentChildX, childrenY);
      currentChildX += TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING;
    });
    
    // --- Calculate final dimensions and offsets ---
    const graphWidth = maxX - minX + TREE_NODE_WIDTH * 2; 
    const graphHeight = maxY - minY + TREE_NODE_HEIGHT * 2; 
    const finalOffsetX = -minX + TREE_NODE_WIDTH; // Shift so minX becomes TREE_NODE_WIDTH (padding)
    const finalOffsetY = -minY + TREE_NODE_HEIGHT; // Shift so minY becomes TREE_NODE_HEIGHT (padding)

    return { 
        layoutNodes: nodes.map(n => ({...n, x: n.x + finalOffsetX, y: n.y + finalOffsetY })),
        lines: newLines.map(l => ({...l, x1: l.x1 + finalOffsetX, y1: l.y1 + finalOffsetY, x2: l.x2 + finalOffsetX, y2: l.y2 + finalOffsetY})),
    };

  }, [people, rootPersonId, getPersonById, getChildrenOf]);

   useEffect(() => {
    if (layoutNodes.length > 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        layoutNodes.forEach(node => {
            minX = Math.min(minX, node.x - TREE_NODE_WIDTH / 2);
            maxX = Math.max(maxX, node.x + TREE_NODE_WIDTH / 2);
            minY = Math.min(minY, node.y - TREE_NODE_HEIGHT / 2);
            maxY = Math.max(maxY, node.y + TREE_NODE_HEIGHT / 2);
        });
        const padding = 50; 
        const finalWidth = (maxX - minX) + padding*2;
        const finalHeight = (maxY - minY) + padding*2;
        
        setDimensions({ width: Math.max(finalWidth, containerRef.current?.clientWidth || 0), height: Math.max(finalHeight, containerRef.current?.clientHeight || 0), offsetX:0, offsetY:0 });
    } else {
        setDimensions({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
    }
}, [layoutNodes]);


  if (!rootPersonId || layoutNodes.length === 0) {
    return <p className="text-center text-gray-500">Select a root person to display the tree.</p>;
  }
  
  // Adjust line endings to connect to node edges instead of centers
  const adjustLineToNodeEdge = (x1: number, y1: number, x2: number, y2: number, lineType: Line['type']) => {
    const dy = y2 - y1;
    const dx = x2 - x1;
    let adjustedY1 = y1;
    let adjustedY2 = y2;
    let adjustedX1 = x1;
    let adjustedX2 = x2;

    if (lineType === 'parent-child' || lineType === 'sibling-branch') {
        if (dy > 0) { // parent above child
            adjustedY1 += TREE_NODE_HEIGHT / 2;
            adjustedY2 -= TREE_NODE_HEIGHT / 2;
        } else if (dy < 0) { // child above parent (not typical here, but for completeness)
            adjustedY1 -= TREE_NODE_HEIGHT / 2;
            adjustedY2 += TREE_NODE_HEIGHT / 2;
        }
        // For horizontal parts of parent-child or sibling branches, no Y adjustment needed if purely horizontal
        // X adjustments for vertical lines if they are not perfectly centered (not handled here)
    } else if (lineType === 'spouse') {
        if (dx > 0) { // spouse1 to left of spouse2
            adjustedX1 += TREE_NODE_WIDTH / 2;
            adjustedX2 -= TREE_NODE_WIDTH / 2;
        } else if (dx < 0) { // spouse1 to right of spouse2
            adjustedX1 -= TREE_NODE_WIDTH / 2;
            adjustedX2 += TREE_NODE_WIDTH / 2;
        }
    }
    // For purely horizontal lines in parent-child or sibling branches (e.g. connecting siblings)
    // and purely vertical lines, these simple adjustments might be enough.
    // Complex angled lines would need trigonometric calculations.
    // Our layout primarily uses vertical and horizontal segments.

    return { x1: adjustedX1, y1: adjustedY1, x2: adjustedX2, y2: adjustedY2 };
  }


  return (
    <div 
        ref={containerRef} 
        className="relative w-full h-full overflow-auto"
        style={{ minWidth: dimensions.width, minHeight: dimensions.height}}
        role="graphics-document"
        aria-label="Family tree visualization"
    >
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        className="absolute top-0 left-0"
        aria-hidden="true" 
      >
        {lines.map(line => {
          const {x1,y1,x2,y2} = adjustLineToNodeEdge(line.x1, line.y1, line.x2, line.y2, line.type);
          return (
          <line
            key={line.key}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={line.type === 'spouse' ? "#cbd5e1" : "#9ca3af"} 
            strokeWidth="2"
          />
        );
        })}
      </svg>
      {layoutNodes.map(node => (
        <TreeNodeCard
          key={node.id}
          person={node}
          style={{
            left: `${node.x - TREE_NODE_WIDTH / 2}px`,
            top: `${node.y - TREE_NODE_HEIGHT / 2}px`,
            width: `${TREE_NODE_WIDTH}px`,
            height: `${TREE_NODE_HEIGHT}px`,
          }}
          isRoot={node.id === rootPersonId} // More reliable check for root
          onClick={() => onNodeClick(node)}
          onDoubleClick={onNodeDoubleClick ? () => onNodeDoubleClick(node) : undefined} // Pass handler
        />
      ))}
    </div>
  );
};