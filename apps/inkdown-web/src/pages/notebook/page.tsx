import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CircleDotIcon } from "lucide-react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { TitleEditor } from "./components/title-editor";
import { useNoteContentQuery, useUpdateNotaMutation } from "@/features/notes/queries/note-query";

export default function NotebookPage() {
 	const [searchParams] = useSearchParams();
	const id = searchParams.get("id") ?? "";
	const { state } = useSidebar();
	
	const { data, isLoading } = useNoteContentQuery(id);
	const updateNoteMutation = useUpdateNotaMutation();

	const [editingNote, setEditingNote] = useState(false);
	const [noteTitle, setNoteTitle] = useState("");
	const [noteContent, setNoteContent] = useState("");

	useEffect(() => {
		if (data) {
			setNoteTitle(data.title);
			setNoteContent(data.content);
		}
	}, [data]);

	useEffect(() => {
		const handleSave = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
				e.preventDefault();
				setEditingNote(false);
				updateNoteMutation.mutate({ id, title: noteTitle, content: noteContent });
			}
		};

		document.addEventListener("keydown", handleSave);

		return () => {
			document.removeEventListener("keydown", handleSave);
		};
	}, [noteTitle, noteContent, id, updateNoteMutation]);

	const contentRef = useRef<HTMLTextAreaElement>(null);

	return (
		<div className="w-full h-full flex flex-col p-5">
			<span className="w-full flex justify-end">
				{editingNote && <CircleDotIcon size={15} />}
			</span>

			{state === "collapsed" && <SidebarTrigger />}

			{data ? (
				<div className="pl-15 w-full h-full flex flex-col pt-8 space-y-5">

					<TitleEditor
						handleChangeTitle={setNoteTitle}
						initialTitle={data.title}
						handleFocusEditor={() => contentRef.current?.focus()}
						handleSaveNote={() => setEditingNote(true)}
					/>
					<textarea
						className="h-full border-none outline-none focus:outline-none focus:ring-0 ring-0 resize-none"
						value={noteContent}
						ref={contentRef}
						onChange={(e) => {
							setNoteContent(e.currentTarget.value);
							setEditingNote(true);
						}}
					>

					</textarea>
				</div>
			) : (
				<div className="w-full h-full flex items-center justify-center">
					<h1 className="text-3xl font-bold">Nenhuma nota selecionada</h1>
				</div>
			)}

			{isLoading && <Skeleton className="w-full h-full" />}
		</div>
		);
}
