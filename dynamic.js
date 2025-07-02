import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Trash2, Layout, Info, Save, Download, Eye } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'source' | 'transform' | 'sink';
}

interface Edge {
  id: string;
  from: string;
  to: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

const PipelineEditor: React.FC = () => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Node type colors
  const getNodeColor = (type: Node['type']) => {
    switch (type) {
      case 'source': return '#3B82F6'; // blue
      case 'transform': return '#10B981'; // green
      case 'sink': return '#F59E0B'; // amber
      default: return '#6B7280'; // gray
    }
  };

  // Add new node
  const addNode = () => {
    const name = prompt('Enter node name:');
    if (!name) return;

    const types: Node['type'][] = ['source', 'transform', 'sink'];
    const type = types[nodes.length % 3]; // Cycle through types

    const newNode: Node = {
      id: generateId(),
      name: name.trim(),
      x: 100 + (nodes.length * 150) % 600,
      y: 100 + Math.floor(nodes.length / 4) * 120,
      type
    };

    setNodes(prev => [...prev, newNode]);
  };

  // Delete selected node or edge
  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes(prev => prev.filter(n => n.id !== selectedNode));
      setEdges(prev => prev.filter(e => e.from !== selectedNode && e.to !== selectedNode));
      setSelectedNode(null);
    } else if (selectedEdge) {
      setEdges(prev => prev.filter(e => e.id !== selectedEdge));
      setSelectedEdge(null);
    }
  }, [selectedNode, selectedEdge]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      if (e.key === 'Escape') {
        setIsConnecting(false);
        setConnectionStart(null);
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleteSelected]);

  // Start connection
  const startConnection = (nodeId: string) => {
    setIsConnecting(true);
    setConnectionStart(nodeId);
  };

  // Complete connection
  const completeConnection = (targetNodeId: string) => {
    if (!connectionStart || connectionStart === targetNodeId) {
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    // Check if connection already exists
    const existingEdge = edges.find(e => 
      (e.from === connectionStart && e.to === targetNodeId) ||
      (e.from === targetNodeId && e.to === connectionStart)
    );

    if (existingEdge) {
      alert('Connection already exists between these nodes!');
      setIsConnecting(false);
      setConnectionStart(null);
      return;
    }

    const newEdge: Edge = {
      id: generateId(),
      from: connectionStart,
      to: targetNodeId
    };

    setEdges(prev => [...prev, newEdge]);
    setIsConnecting(false);
    setConnectionStart(null);
  };

  // Mouse handlers for node dragging
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return; // Only left click
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggedNode(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    });
    setSelectedNode(nodeId);
    setSelectedEdge(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNode) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    setNodes(prev => prev.map(node => 
      node.id === draggedNode 
        ? { ...node, x: Math.max(0, newX), y: Math.max(0, newY) }
        : node
    ));
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };

  // Get node position
  const getNodeById = (id: string) => nodes.find(n => n.id === id);

  // DAG Validation
  const validateDAG = (): ValidationResult => {
    const errors: string[] = [];

    // Check minimum nodes
    if (nodes.length < 2) {
      errors.push('Pipeline must have at least 2 nodes');
    }

    // Check if all nodes are connected
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.from);
      connectedNodes.add(edge.to);
    });

    const unconnectedNodes = nodes.filter(node => !connectedNodes.has(node.id));
    if (unconnectedNodes.length > 0) {
      errors.push(`Unconnected nodes: ${unconnectedNodes.map(n => n.name).join(', ')}`);
    }

    // Check for cycles using DFS
    const hasCycles = () => {
      const visited = new Set<string>();
      const recStack = new Set<string>();

      const dfs = (nodeId: string): boolean => {
        visited.add(nodeId);
        recStack.add(nodeId);

        const outgoingEdges = edges.filter(e => e.from === nodeId);
        for (const edge of outgoingEdges) {
          if (!visited.has(edge.to)) {
            if (dfs(edge.to)) return true;
          } else if (recStack.has(edge.to)) {
            return true;
          }
        }

        recStack.delete(nodeId);
        return false;
      };

      for (const node of nodes) {
        if (!visited.has(node.id)) {
          if (dfs(node.id)) return true;
        }
      }
      return false;
    };

    if (hasCycles()) {
      errors.push('Pipeline contains cycles (not a valid DAG)');
    }

    return {
      isValid: errors.length === 0 && nodes.length >= 2,
      errors
    };
  };

  const validation = validateDAG();

  // Auto Layout using simple hierarchical layout
  const autoLayout = () => {
    if (nodes.length === 0) return;

    // Simple layered layout
    const layers: string[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // Calculate in-degrees
    nodes.forEach(node => inDegree.set(node.id, 0));
    edges.forEach(edge => {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // Topological sort to create layers
    const queue = nodes.filter(node => inDegree.get(node.id) === 0).map(n => n.id);
    let layerIndex = 0;

    while (queue.length > 0) {
      const currentLayer = [...queue];
      layers[layerIndex] = currentLayer;
      queue.length = 0;

      currentLayer.forEach(nodeId => {
        visited.add(nodeId);
        const outgoingEdges = edges.filter(e => e.from === nodeId);
        outgoingEdges.forEach(edge => {
          const newInDegree = (inDegree.get(edge.to) || 0) - 1;
          inDegree.set(edge.to, newInDegree);
          if (newInDegree === 0 && !visited.has(edge.to)) {
            queue.push(edge.to);
          }
        });
      });
      layerIndex++;
    }

    // Position nodes in layers
    const layerHeight = 150;
    const nodeWidth = 120;
    const startY = 50;

    setNodes(prev => prev.map(node => {
      const layer = layers.findIndex(l => l.includes(node.id));
      const positionInLayer = layers[layer]?.indexOf(node.id) || 0;
      const layerSize = layers[layer]?.length || 1;
      
      return {
        ...node,
        x: 100 + positionInLayer * nodeWidth + (800 - layerSize * nodeWidth) / 2,
        y: startY + layer * layerHeight
      };
    }));
  };

  return (
    <div className="w-full h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pipeline Editor</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={addNode}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Node</span>
          </button>
          <button
            onClick={autoLayout}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            disabled={nodes.length === 0}
          >
            <Layout size={20} />
            <span>Auto Layout</span>
          </button>
          <button
            onClick={() => setShowJsonPreview(!showJsonPreview)}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Eye size={20} />
            <span>JSON Preview</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`p-3 text-sm font-medium ${
        validation.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        <div className="flex items-center space-x-2">
          <Info size={16} />
          <span>
            {validation.isValid ? 'Valid DAG' : 'Invalid Pipeline'}
            {validation.errors.length > 0 && ': ' + validation.errors.join(', ')}
          </span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Canvas */}
        <div 
          ref={containerRef}
          className="flex-1 relative overflow-hidden cursor-grab"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={() => {
            setSelectedNode(null);
            setSelectedEdge(null);
          }}
        >
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1 }}
          >
            {/* Edges */}
            {edges.map(edge => {
              const fromNode = getNodeById(edge.from);
              const toNode = getNodeById(edge.to);
              if (!fromNode || !toNode) return null;

              const fromX = fromNode.x + 80;
              const fromY = fromNode.y + 30;
              const toX = toNode.x;
              const toY = toNode.y + 30;

              return (
                <g key={edge.id}>
                  <line
                    x1={fromX}
                    y1={fromY}
                    x2={toX}
                    y2={toY}
                    stroke={selectedEdge === edge.id ? '#EF4444' : '#6B7280'}
                    strokeWidth={selectedEdge === edge.id ? 3 : 2}
                    markerEnd="url(#arrowhead)"
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdge(edge.id);
                      setSelectedNode(null);
                    }}
                  />
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={selectedEdge === edge.id ? '#EF4444' : '#6B7280'}
                      />
                    </marker>
                  </defs>
                </g>
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-24 h-16 rounded-lg border-2 bg-white shadow-lg cursor-move select-none ${
                selectedNode === node.id ? 'border-blue-500 shadow-xl' : 'border-gray-300'
              } ${isConnecting && connectionStart === node.id ? 'ring-2 ring-blue-400' : ''}`}
              style={{
                left: node.x,
                top: node.y,
                borderColor: selectedNode === node.id ? '#3B82F6' : getNodeColor(node.type),
                zIndex: selectedNode === node.id ? 10 : 2
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => {
                e.stopPropagation();
                if (isConnecting && connectionStart !== node.id) {
                  completeConnection(node.id);
                } else {
                  setSelectedNode(node.id);
                  setSelectedEdge(null);
                }
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                startConnection(node.id);
              }}
            >
              <div className="p-2 text-center h-full flex flex-col justify-center">
                <div className={`text-xs font-medium mb-1`} style={{ color: getNodeColor(node.type) }}>
                  {node.type.toUpperCase()}
                </div>
                <div className="text-xs font-semibold text-gray-900 truncate">
                  {node.name}
                </div>
              </div>
              
              {/* Connection points */}
              <div 
                className="absolute left-0 top-1/2 w-3 h-3 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                title="Input"
              />
              <div 
                className="absolute right-0 top-1/2 w-3 h-3 bg-green-500 rounded-full transform translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-sm hover:scale-110 transition-transform" 
                title="Output"
              />
            </div>
          ))}

          {/* Instructions */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500 max-w-md">
                <Plus size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-3">Click "Add Node" to get started</p>
                <div className="text-sm space-y-1 bg-white p-4 rounded-lg shadow-sm border">
                  <p><strong>Quick Start:</strong></p>
                  <p>1. Click "Add Node" to create nodes</p>
                  <p>2. Double-click a node to start connecting</p>
                  <p>3. Click another node to complete the connection</p>
                  <p>4. Use "Auto Layout" to organize your pipeline</p>
                </div>
              </div>
            </div>
          )}

          {/* Connection mode indicator */}
          {isConnecting && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
              Click target node to connect (ESC to cancel)
            </div>
          )}
        </div>

        {/* JSON Preview Panel */}
        {showJsonPreview && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Pipeline JSON</h3>
            <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify({ nodes, edges, validation }, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-gray-100 p-2 text-xs text-gray-600 border-t">
        <strong>Controls:</strong> Click to select • Double-click to connect • Drag to move • Delete/Backspace to remove • ESC to cancel
      </div>
    </div>
  );
};

export default PipelineEditor;