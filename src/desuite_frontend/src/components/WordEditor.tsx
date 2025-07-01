import { useState } from 'react';
import { Color } from '@tiptap/extension-color';
import ListItem from '@tiptap/extension-list-item';
import TextStyle from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import { EditorProvider, useCurrentEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Strikethrough,
  Code,
  FileDown,
  FilePlus,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Save,
  FileText,
  type LucideIcon
} from 'lucide-react';
import { file_management } from '../../../declarations/file_management';

interface ToolbarButtonProps {
  icon: LucideIcon;
  isActive?: boolean;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
}

const ToolbarButton = ({ icon: Icon, isActive, onClick, disabled, tooltip }: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={tooltip}
    className={`p-2 rounded-md transition-all duration-200 ${
      isActive 
        ? 'bg-yellow-500 text-black shadow-md' 
        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <Icon size={18} />
  </button>
);

const MenuBar = () => {
  const { editor } = useCurrentEditor();
  const [saving, setSaving] = useState(false);
  const [documentName, setDocumentName] = useState('Untitled Document');

  if (!editor) return null;

  const convertHtmlToDoc = (html: string) => {
    // Add Word document compatibility meta tags
    const docContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' 
            xmlns:w='urn:schemas-microsoft-com:office:word'
            xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Calibri, sans-serif; }
          /* Add any additional styling here */
        </style>
      </head>
      <body>
        ${html}
      </body>
      </html>
    `;
    return docContent;
  };

  const exportToDoc = () => {
    if (editor) {
      const html = editor.getHTML();
      const docContent = convertHtmlToDoc(html);
      const blob = new Blob([docContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName}.doc`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const saveToFiles = async () => {
    if (editor) {
      setSaving(true);
      try {
        const html = editor.getHTML();
        const docContent = convertHtmlToDoc(html);
        const blob = new Blob([docContent], { type: 'application/msword' });
        const arrayBuffer = await blob.arrayBuffer();
        const result = await file_management.uploadFile(
          `${documentName}.doc`,
          'application/msword',
          Array.from(new Uint8Array(arrayBuffer))
        );
        if ('ok' in result) {
          alert('Document saved successfully to files!');
        } else {
          alert('Error saving document: ' + result.err);
        }
      } catch (error) {
        console.error('Error saving document:', error);
        alert('Failed to save document');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="bg-gray-800/95 backdrop-blur supports-[backdrop-filter]:bg-gray-800/75 p-4 rounded-lg shadow-lg mb-4 sticky top-0 z-50">
      {/* Document Title */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-yellow-500" />
          <input
            type="text"
            value={documentName}
            onChange={(e) => setDocumentName(e.target.value)}
            className="bg-transparent text-white text-lg font-semibold focus:outline-none border-b-2 border-transparent focus:border-yellow-500 transition-colors"
            placeholder="Untitled Document"
          />
        </div>
        
        {/* Actions - Moved to title bar */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportToDoc}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            <FileDown size={18} />
            Export as DOC
          </button>
          <button
            onClick={saveToFiles}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-black border-t-transparent" />
            ) : (
              <Save size={18} />
            )}
            Save to Files
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Page Settings */}
        <div className="flex items-center gap-2 px-2 py-1 bg-gray-700/50 rounded-lg">
          <select
            onChange={(e) => {
              const page = document.querySelector('.page');
              page?.classList.remove('a4', 'letter');
              page?.classList.add(e.target.value);
            }}
            className="bg-transparent text-white rounded px-2 py-1 text-sm focus:outline-none"
          >
            <option value="a4">A4</option>
            <option value="letter">US Letter</option>
          </select>
          <div className="w-px h-6 bg-gray-600" />
          <select
            onChange={(e) => {
              const page = document.querySelector('.page');
              if (e.target.value === 'landscape') {
                page?.classList.add('landscape');
              } else {
                page?.classList.remove('landscape');
              }
            }}
            className="bg-transparent text-white rounded px-2 py-1 text-sm focus:outline-none"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-lg">
          {[
            { icon: AlignLeft, align: 'left', tooltip: 'Align Left' },
            { icon: AlignCenter, align: 'center', tooltip: 'Center' },
            { icon: AlignRight, align: 'right', tooltip: 'Align Right' },
            { icon: AlignJustify, align: 'justify', tooltip: 'Justify' }
          ].map((item) => (
            <ToolbarButton
              key={item.align}
              icon={item.icon}
              isActive={editor.isActive({ textAlign: item.align })}
              onClick={() => editor.chain().focus().setTextAlign(item.align).run()}
              tooltip={item.tooltip}
            />
          ))}
        </div>

        {/* Text Formatting */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-lg">
          <ToolbarButton
            icon={Bold}
            isActive={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
            tooltip="Bold"
          />
          <ToolbarButton
            icon={Italic}
            isActive={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            tooltip="Italic"
          />
          <ToolbarButton
            icon={Strikethrough}
            isActive={editor.isActive('strike')}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            tooltip="Strikethrough"
          />
          <ToolbarButton
            icon={Code}
            isActive={editor.isActive('code')}
            onClick={() => editor.chain().focus().toggleCode().run()}
            tooltip="Code"
          />
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-lg">
          <ToolbarButton
            icon={Heading1}
            isActive={editor.isActive('heading', { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            tooltip="Heading 1"
          />
          <ToolbarButton
            icon={Heading2}
            isActive={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            tooltip="Heading 2"
          />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-lg">
          <ToolbarButton
            icon={List}
            isActive={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            tooltip="Bullet List"
          />
          <ToolbarButton
            icon={ListOrdered}
            isActive={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            tooltip="Numbered List"
          />
          <ToolbarButton
            icon={Quote}
            isActive={editor.isActive('blockquote')}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            tooltip="Quote"
          />
        </div>

        {/* History */}
        <div className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded-lg">
          <ToolbarButton
            icon={Undo}
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            tooltip="Undo"
          />
          <ToolbarButton
            icon={Redo}
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            tooltip="Redo"
          />
        </div>
      </div>
    </div>
  );
};

const extensions = [
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure(),
  TextAlign.configure({
    types: ['heading', 'paragraph'],
    alignments: ['left', 'center', 'right', 'justify'],
    defaultAlignment: 'left',
  }),
  StarterKit.configure({
    bulletList: {
      keepMarks: true,
      keepAttributes: false,
    },
    orderedList: {
      keepMarks: true,
      keepAttributes: false,
    },
  }),
];

const content = `
<h2>Start writing your document...</h2>
<p>Click any of the formatting tools above to style your text.</p>
`;

export default function WordEditor() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="mx-auto max-w-[1200px] p-6">
        <h2 className="text-2xl font-bold mb-6 text-yellow-500 flex items-center">
          <FilePlus className="h-8 w-8 mr-2" />
          Document Editor
        </h2>
        <div className="word-editor">
          <EditorProvider
            slotBefore={<MenuBar />}
            extensions={extensions}
            content={content}
            editorProps={{
              attributes: {
                class: 'page a4 prose prose-sm max-w-none bg-white text-gray-900 shadow-xl mx-auto p-8 min-h-[1123px] rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500/20',
              },
            }}
          >
            <div className="editor-main bg-gray-800 p-6 rounded-lg">
              <div className="page-container" />
            </div>
          </EditorProvider>
        </div>
      </div>
    </div>
  );
}