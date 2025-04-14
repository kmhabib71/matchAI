"use client";

import {
  useEditor,
  EditorContent,
  Editor as TiptapEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useState } from "react";

// Menu button component
const MenuButton = ({
  onClick,
  isActive = false,
  disabled = false,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`p-2 rounded ${
      isActive
        ? "bg-purple-100 text-purple-800"
        : "text-gray-600 hover:bg-gray-100"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </button>
);

interface EditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export default function Editor({ initialContent, onChange }: EditorProps) {
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your blog post...",
      }),
      Image,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-purple-600 underline",
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  // Insert image function
  const addImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageInput(false);
    }
  };

  // Add link function
  const addLink = () => {
    if (linkUrl && editor) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkUrl })
        .run();
      setLinkUrl("");
      setShowLinkInput(false);
    }
  };

  // Remove link function
  const removeLink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
  };

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <div className="bg-gray-50 p-2 border-b border-gray-300 flex flex-wrap gap-1">
        {/* Text formatting */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
        >
          <span className="font-bold">B</span>
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
        >
          <span className="italic">I</span>
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
        >
          <span className="line-through">S</span>
        </MenuButton>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        {/* Headings */}
        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          isActive={editor.isActive("heading", { level: 1 })}
        >
          H1
        </MenuButton>

        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          isActive={editor.isActive("heading", { level: 2 })}
        >
          H2
        </MenuButton>

        <MenuButton
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          isActive={editor.isActive("heading", { level: 3 })}
        >
          H3
        </MenuButton>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        {/* Lists */}
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
        >
          • List
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
        >
          1. List
        </MenuButton>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        {/* Link handling */}
        <MenuButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          isActive={editor.isActive("link")}
        >
          🔗 Link
        </MenuButton>

        {editor.isActive("link") && (
          <MenuButton onClick={removeLink}>🗑️ Remove Link</MenuButton>
        )}

        {/* Image handling */}
        <MenuButton onClick={() => setShowImageInput(!showImageInput)}>
          🖼️ Image
        </MenuButton>

        <div className="w-px h-6 mx-1 bg-gray-300" />

        {/* Undo/Redo */}
        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          ↩️ Undo
        </MenuButton>

        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          ↪️ Redo
        </MenuButton>
      </div>

      {/* Link URL input */}
      {showLinkInput && (
        <div className="flex items-center p-2 bg-gray-50 border-b border-gray-300">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 px-2 py-1 border border-gray-300 rounded-md mr-2"
          />
          <button
            onClick={addLink}
            className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add Link
          </button>
          <button
            onClick={() => setShowLinkInput(false)}
            className="px-3 py-1 ml-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image URL input */}
      {showImageInput && (
        <div className="flex items-center p-2 bg-gray-50 border-b border-gray-300">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="flex-1 px-2 py-1 border border-gray-300 rounded-md mr-2"
          />
          <button
            onClick={addImage}
            className="px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Add Image
          </button>
          <button
            onClick={() => setShowImageInput(false)}
            className="px-3 py-1 ml-2 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent
        editor={editor}
        className="p-4 min-h-[300px] prose max-w-none"
      />
    </div>
  );
}
