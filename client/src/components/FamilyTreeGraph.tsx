import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FamilyMember } from '@shared/schema';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { User, Heart, Users } from 'lucide-react';

const TREE_NODE_WIDTH = 160;
const TREE_NODE_HEIGHT = 80;
const GEN_VERT_SPACING = 120; 
const SIBLING_HORIZ_SPACING = 50; 
const SPOUSE_OFFSET_X = TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING;

interface LayoutNode extends FamilyMember {
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
  people: FamilyMember[];
  rootPersonId: number;
  onNodeClick: (person: FamilyMember) => void;
  onNodeDoubleClick?: (person: FamilyMember) => void;
}

const TreeNodeCard: React.FC<{
  person: LayoutNode;
  style: React.CSSProperties;
  isRoot?: boolean;
  onClick: () => void;
  onDoubleClick?: () => void;
}> = ({ person, style, isRoot, onClick, onDoubleClick }) => {
  const getGenderIcon = () => {
    if (person.gender === 'male') return <User className="w-4 h-4 text-blue-500" />;
    if (person.gender === 'female') return <User className="w-4 h-4 text-pink-500" />;
    return <Users className="w-4 h-4 text-gray-500" />;
  };

  const getBorderColor = () => {
    if (isRoot) return 'border-amber-400 border-2';
    if (person.isSpouse) return 'border-pink-300';
    if (person.isParent) return 'border-blue-300';
    if (person.isChild) return 'border-green-300';
    return 'border-gray-300';
  };

  return (
    <Card 
      className={`absolute cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${getBorderColor()}`}
      style={style}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <CardContent className="p-3 h-full flex flex-col justify-center items-center text-center">
        <div className="flex items-center gap-1 mb-1">
          {getGenderIcon()}
          {isRoot && <Heart className="w-3 h-3 text-amber-500" />}
        </div>
        <h4 className="font-semibold text-sm truncate w-full">{person.name}</h4>
        <p className="text-xs text-muted-foreground">
          {person.relationship || 'Family Member'}
        </p>
        {person.birthDate && (
          <p className="text-xs text-muted-foreground">
            {new Date(person.birthDate).getFullYear()}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const FamilyTreeGraph: React.FC<FamilyTreeGraphProps> = ({
  people,
  rootPersonId,
  onNodeClick,
  onNodeDoubleClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const getPersonById = (id: number) => people.find(p => p.id === id);
  
  // Find family relationships based on the relationship field
  const getChildrenOf = (personId: number) => {
    const person = getPersonById(personId);
    if (!person) return [];
    
    // Find children by looking for people whose relationship indicates they are children
    return people.filter(p => 
      p.relationship?.toLowerCase().includes('child') ||
      p.relationship?.toLowerCase().includes('son') ||
      p.relationship?.toLowerCase().includes('daughter')
    );
  };

  const getParentsOf = (personId: number) => {
    const person = getPersonById(personId);
    if (!person) return [];
    
    // Find parents by looking for people whose relationship indicates they are parents
    return people.filter(p => 
      p.relationship?.toLowerCase().includes('parent') ||
      p.relationship?.toLowerCase().includes('father') ||
      p.relationship?.toLowerCase().includes('mother')
    );
  };

  const getSpousesOf = (personId: number) => {
    const person = getPersonById(personId);
    if (!person) return [];
    
    // Find spouses by looking for people whose relationship indicates they are spouses
    return people.filter(p => 
      p.relationship?.toLowerCase().includes('spouse') ||
      p.relationship?.toLowerCase().includes('wife') ||
      p.relationship?.toLowerCase().includes('husband') ||
      p.relationship?.toLowerCase().includes('partner')
    );
  };

  const getSiblingsOf = (personId: number) => {
    const person = getPersonById(personId);
    if (!person) return [];
    
    // Find siblings by looking for people whose relationship indicates they are siblings
    return people.filter(p => 
      p.id !== personId && (
        p.relationship?.toLowerCase().includes('brother') ||
        p.relationship?.toLowerCase().includes('sister') ||
        p.relationship?.toLowerCase().includes('sibling')
      )
    );
  };

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

    // Add parents
    const parents = getParentsOf(rootPersonId);
    const parentY = logicalRootY - (TREE_NODE_HEIGHT + GEN_VERT_SPACING);
    
    parents.forEach((parent, index) => {
      const parentX = logicalRootX + (index - (parents.length - 1) / 2) * (TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING);
      nodes.push({ ...parent, x: parentX, y: parentY, isParent: true });
      newLines.push({ 
        x1: parentX, y1: parentY + TREE_NODE_HEIGHT / 2, 
        x2: logicalRootX, y2: logicalRootY - TREE_NODE_HEIGHT / 2, 
        key: `p-${parent.id}-${rootPerson.id}`, 
        type: 'parent-child' 
      });
      updateBounds(parentX, parentY);
      
      // Connect spouses
      if (index > 0) {
        const prevParent = parents[index - 1];
        const prevParentX = logicalRootX + (index - 1 - (parents.length - 1) / 2) * (TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING);
        newLines.push({ 
          x1: prevParentX + TREE_NODE_WIDTH / 2, y1: parentY, 
          x2: parentX - TREE_NODE_WIDTH / 2, y2: parentY, 
          key: `s-${prevParent.id}-${parent.id}`, 
          type: 'spouse' 
        });
      }
    });

    // Add root and siblings
    const siblings = getSiblingsOf(rootPersonId);
    const rootAndSiblings = [{ ...rootPerson, isRoot: true }, ...siblings.map(s => ({ ...s, isSibling: true }))];
    
    const mainGenerationY = logicalRootY;
    const rootAndSiblingsCount = rootAndSiblings.length;
    const rootAndSiblingsTotalWidth = rootAndSiblingsCount * TREE_NODE_WIDTH + (rootAndSiblingsCount - 1) * SIBLING_HORIZ_SPACING;
    let currentMainGenX = logicalRootX - rootAndSiblingsTotalWidth / 2 + TREE_NODE_WIDTH / 2;
    
    rootAndSiblings.forEach(rs => {
      nodes.push({ ...rs, x: currentMainGenX, y: mainGenerationY });
      updateBounds(currentMainGenX, mainGenerationY);
      currentMainGenX += TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING;
    });

    // Find the root node for positioning spouses and children
    const placedRootNode = nodes.find(n => n.id === rootPerson.id)!;
    const rootDisplayX = placedRootNode.x;

    // Add spouses of root
    const spouses = getSpousesOf(rootPersonId);
    spouses.forEach((spouse, index) => {
      const spouseX = rootDisplayX + SPOUSE_OFFSET_X * (index + 1);
      const spouseY = mainGenerationY;
      nodes.push({ ...spouse, x: spouseX, y: spouseY, isSpouse: true });
      newLines.push({ 
        x1: rootDisplayX + TREE_NODE_WIDTH / 2, y1: spouseY, 
        x2: spouseX - TREE_NODE_WIDTH / 2, y2: spouseY, 
        key: `s-${rootPerson.id}-${spouse.id}`, 
        type: 'spouse' 
      });
      updateBounds(spouseX, spouseY);
    });

    // Add children of root
    const children = getChildrenOf(rootPersonId);
    if (children.length > 0) {
      const childrenY = mainGenerationY + TREE_NODE_HEIGHT + GEN_VERT_SPACING;
      const childrenTotalWidth = children.length * TREE_NODE_WIDTH + (children.length - 1) * SIBLING_HORIZ_SPACING;
      let currentChildX = rootDisplayX - childrenTotalWidth / 2 + TREE_NODE_WIDTH / 2;

      children.forEach(child => {
        nodes.push({ ...child, x: currentChildX, y: childrenY, isChild: true });
        newLines.push({ 
          x1: rootDisplayX, y1: mainGenerationY + TREE_NODE_HEIGHT / 2, 
          x2: currentChildX, y2: childrenY - TREE_NODE_HEIGHT / 2, 
          key: `c-${child.id}-${rootPerson.id}`, 
          type: 'parent-child' 
        });
        updateBounds(currentChildX, childrenY);
        currentChildX += TREE_NODE_WIDTH + SIBLING_HORIZ_SPACING;
      });
    }

    // Calculate final dimensions and offsets
    const graphWidth = maxX - minX + TREE_NODE_WIDTH * 2; 
    const graphHeight = maxY - minY + TREE_NODE_HEIGHT * 2; 
    const finalOffsetX = -minX + TREE_NODE_WIDTH;
    const finalOffsetY = -minY + TREE_NODE_HEIGHT;

    return { 
      layoutNodes: nodes.map(n => ({ ...n, x: n.x + finalOffsetX, y: n.y + finalOffsetY })),
      lines: newLines.map(l => ({ 
        ...l, 
        x1: l.x1 + finalOffsetX, 
        y1: l.y1 + finalOffsetY, 
        x2: l.x2 + finalOffsetX, 
        y2: l.y2 + finalOffsetY 
      })),
    };
  }, [people, rootPersonId]);

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
      const finalWidth = (maxX - minX) + padding * 2;
      const finalHeight = (maxY - minY) + padding * 2;
      
      setDimensions({ 
        width: Math.max(finalWidth, containerRef.current?.clientWidth || 800), 
        height: Math.max(finalHeight, containerRef.current?.clientHeight || 600) 
      });
    } else {
      setDimensions({ width: 800, height: 600 });
    }
  }, [layoutNodes]);

  if (!rootPersonId || layoutNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <div className="text-center">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>Select a family member to display the tree</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-auto bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 rounded-lg"
      style={{ minWidth: dimensions.width, minHeight: dimensions.height }}
      role="graphics-document"
      aria-label="Family tree visualization"
    >
      <svg 
        width={dimensions.width} 
        height={dimensions.height} 
        className="absolute top-0 left-0"
        aria-hidden="true" 
      >
        {lines.map(line => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke={line.type === 'spouse' ? "#ec4899" : "#6b7280"} 
            strokeWidth={line.type === 'spouse' ? "3" : "2"}
            strokeDasharray={line.type === 'spouse' ? "5,5" : "none"}
          />
        ))}
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
          isRoot={node.id === rootPersonId}
          onClick={() => onNodeClick(node)}
          onDoubleClick={onNodeDoubleClick ? () => onNodeDoubleClick(node) : undefined}
        />
      ))}
    </div>
  );
};