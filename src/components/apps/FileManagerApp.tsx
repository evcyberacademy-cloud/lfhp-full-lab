'use client';

import React, { useState } from 'react';
import { useVFS } from '@/context/VFSContext';
import { useDesktop } from '@/context/DesktopContext';
import { VFSNode } from '@/types/vfs';
import { modeToPermissionsString } from '@/lib/vfs/vfs-permissions';
import { 
  Folder, 
  FileText, 
  FileCode, 
  ChevronRight, 
  Home, 
  HardDrive, 
  Trash2, 
  Plus, 
  FolderPlus, 
  LayoutGrid, 
  List, 
  Terminal, 
  ShieldAlert,
  ArrowUp
} from 'lucide-react';

export const FileManagerApp: React.FC = () => {
  const { vfsState, vfsEngine, createFile, createDirectory, deleteNode } = useVFS();
  const { openApp } = useDesktop();

  const [currentPath, setCurrentPath] = useState<string>('/home/student');
  const [selectedNode, setSelectedNode] = useState<VFSNode | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const listRes = vfsEngine ? vfsEngine.listDirectory(currentPath) : { success: true, data: [] };
  const currentNodes = listRes.data || [];

  const handleNavigate = (path: string) => {
    setCurrentPath(path);
    setSelectedNode(null);
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
    handleNavigate(parent);
  };

  const handleNodeDoubleClick = (node: VFSNode) => {
    if (node.type === 'directory') {
      handleNavigate(node.path);
    } else {
      openApp('text-editor', { filePath: node.path, title: node.name });
    }
  };

  const handleCreateFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const path = `${currentPath === '/' ? '' : currentPath}/${newFileName.trim()}`;
    createFile(path, '');
    setNewFileName('');
    setIsCreatingFile(false);
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    const path = `${currentPath === '/' ? '' : currentPath}/${newFileName.trim()}`;
    createDirectory(path);
    setNewFileName('');
    setIsCreatingFolder(false);
  };

  const handleDelete = (node: VFSNode) => {
    if (confirm(`Delete '${node.name}'?`)) {
      deleteNode(node.path, true);
      setSelectedNode(null);
    }
  };

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-200 select-none">
      {/* Top Breadcrumb & Action Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 text-xs">
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <button
            onClick={handleGoUp}
            disabled={currentPath === '/'}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ArrowUp className="w-4 h-4" />
          </button>

          <button
            onClick={() => handleNavigate('/')}
            className={`px-2 py-1 rounded font-mono ${currentPath === '/' ? 'bg-cyan-950 text-cyan-300 font-bold' : 'hover:bg-slate-800 text-slate-400'}`}
          >
            /
          </button>

          {breadcrumbs.map((segment, idx) => {
            const pathUpToSegment = '/' + breadcrumbs.slice(0, idx + 1).join('/');
            const isLast = idx === breadcrumbs.length - 1;

            return (
              <React.Fragment key={pathUpToSegment}>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <button
                  onClick={() => handleNavigate(pathUpToSegment)}
                  className={`px-2 py-1 rounded font-mono truncate max-w-[120px] ${
                    isLast ? 'bg-cyan-950 text-cyan-300 font-bold' : 'hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  {segment}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={() => { setIsCreatingFile(true); setIsCreatingFolder(false); }}
            title="Create New File"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">New File</span>
          </button>

          <button
            onClick={() => { setIsCreatingFolder(true); setIsCreatingFile(false); }}
            title="Create New Directory"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-cyan-400 flex items-center gap-1"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">New Folder</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => setViewMode(prev => prev === 'grid' ? 'list' : 'grid')}
            title="Toggle View Mode"
            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Body with Quick Nav Sidebar and File Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-44 bg-slate-900/60 border-r border-slate-800 p-2 hidden sm:flex flex-col gap-1 text-xs">
          <span className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Favorites</span>
          <button
            onClick={() => handleNavigate('/home/student')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              currentPath === '/home/student' ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <Home className="w-4 h-4 text-cyan-400" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleNavigate('/home/student/labs')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              currentPath === '/home/student/labs' ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <Folder className="w-4 h-4 text-emerald-400" />
            <span>Labs</span>
          </button>

          <button
            onClick={() => handleNavigate('/home/student/Desktop')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              currentPath === '/home/student/Desktop' ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <Folder className="w-4 h-4 text-amber-400" />
            <span>Desktop</span>
          </button>

          <span className="px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-3">System</span>
          <button
            onClick={() => handleNavigate('/')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              currentPath === '/' ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <HardDrive className="w-4 h-4 text-slate-400" />
            <span>Root (/)</span>
          </button>

          <button
            onClick={() => handleNavigate('/etc')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              currentPath === '/etc' ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <Folder className="w-4 h-4 text-purple-400" />
            <span>/etc (Config)</span>
          </button>

          <button
            onClick={() => handleNavigate('/var/log')}
            className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
              currentPath === '/var/log' ? 'bg-cyan-950/60 text-cyan-300 font-semibold' : 'hover:bg-slate-800/60 text-slate-300'
            }`}
          >
            <Folder className="w-4 h-4 text-rose-400" />
            <span>/var/log</span>
          </button>
        </div>

        {/* Files Content Grid / List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* New Item Inline Input */}
          {(isCreatingFile || isCreatingFolder) && (
            <form 
              onSubmit={isCreatingFile ? handleCreateFileSubmit : handleCreateFolderSubmit}
              className="p-2 bg-slate-900 border-b border-cyan-500/30 flex items-center gap-2 text-xs"
            >
              <span className="text-cyan-400 font-semibold">
                {isCreatingFile ? 'New File Name:' : 'New Folder Name:'}
              </span>
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={e => setNewFileName(e.target.value)}
                placeholder={isCreatingFile ? 'e.g. script.sh' : 'e.g. recon'}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-400 text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => { setIsCreatingFile(false); setIsCreatingFolder(false); }}
                className="px-2 py-1 rounded text-slate-400 hover:text-white"
              >
                Cancel
              </button>
            </form>
          )}

          {/* Files Display Area */}
          <div 
            onClick={() => setSelectedNode(null)}
            className="flex-1 p-3 overflow-auto"
          >
            {currentNodes.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                Directory is empty
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {currentNodes.map(node => (
                  <button
                    key={node.id}
                    onClick={e => { e.stopPropagation(); setSelectedNode(node); }}
                    onDoubleClick={() => handleNodeDoubleClick(node)}
                    className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                      selectedNode?.id === node.id
                        ? 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-400/40 shadow-cyber-glow'
                        : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-1.5">
                      {node.type === 'directory' ? (
                        <Folder className="w-10 h-10 text-amber-400" />
                      ) : node.name.endsWith('.sh') ? (
                        <FileCode className="w-10 h-10 text-emerald-400" />
                      ) : (
                        <FileText className="w-10 h-10 text-slate-300" />
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-200 truncate w-full text-center">
                      {node.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {node.type === 'directory' ? 'folder' : `${node.size} B`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              /* List Mode */
              <div className="w-full text-xs font-mono">
                <div className="grid grid-cols-12 px-3 py-1.5 text-slate-500 font-semibold border-b border-slate-800">
                  <span className="col-span-5">Name</span>
                  <span className="col-span-2">Permissions</span>
                  <span className="col-span-2">Owner</span>
                  <span className="col-span-1">Size</span>
                  <span className="col-span-2">Modified</span>
                </div>
                {currentNodes.map(node => (
                  <div
                    key={node.id}
                    onClick={e => { e.stopPropagation(); setSelectedNode(node); }}
                    onDoubleClick={() => handleNodeDoubleClick(node)}
                    className={`grid grid-cols-12 px-3 py-2 rounded-lg items-center cursor-pointer transition-colors ${
                      selectedNode?.id === node.id
                        ? 'bg-cyan-950/50 text-cyan-300 border border-cyan-500/30'
                        : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="col-span-5 flex items-center gap-2 truncate">
                      {node.type === 'directory' ? <Folder className="w-4 h-4 text-amber-400 shrink-0" /> : <FileText className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className="truncate">{node.name}</span>
                    </div>
                    <span className="col-span-2 text-slate-400">{modeToPermissionsString(node.mode, node.type)}</span>
                    <span className="col-span-2 text-slate-400">{node.owner}:{node.group}</span>
                    <span className="col-span-1 text-slate-400">{node.type === 'directory' ? '-' : `${node.size}B`}</span>
                    <span className="col-span-2 text-slate-500 text-[11px] truncate">
                      {new Date(node.modifiedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom Inspector Bar for Selected Node */}
          {selectedNode && (
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-4 truncate">
                <span className="font-bold text-slate-200 truncate">{selectedNode.name}</span>
                <span className="text-cyan-400">{modeToPermissionsString(selectedNode.mode, selectedNode.type)} ({selectedNode.mode.toString(8).padStart(3, '0')})</span>
                <span className="text-slate-400">Owner: {selectedNode.owner}:{selectedNode.group}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedNode.type === 'file' && (
                  <button
                    onClick={() => openApp('text-editor', { filePath: selectedNode.path, title: selectedNode.name })}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold"
                  >
                    Edit File
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedNode)}
                  title="Delete"
                  className="p-1 rounded hover:bg-rose-950 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
