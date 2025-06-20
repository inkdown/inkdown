import type { DirectoryDataType } from "./features/notes/types/directory-types";
import type { NoteDataType } from "./features/notes/types/note-types";

export const COLORS = [
	"#ef4444",
	"#f97316",
	"#eab308",
	"#22c55e",
	"#3b82f6",
	"#6366f1",
	"#a855f7",
	"#ec4899",
];


export const userData = {
	name: "Lucas",
	email: "furquimmsw@gmail.com",
	avatarUrl: "https://github.com/l-furquim.png",
};

export const notifications = [
	{
		title: "Jose favoritou sua nota compartilhada !",
		id: 1,
	},
	{
		title: "Jose favoritou sua nota compartilhada !",
		id: 2,
	},
	{
		title: "Jose favoritou sua nota compartilhada !",
		id: 3,
	},
	{
		title: "Jose favoritou sua nota compartilhada !",
		id: 4,
	},
];

export const notas: NoteDataType[] = [
	{
		name: "Nota excluida",
		id: "1",
		archived: true,
		directoryId: null,
	},
	{
		name: "Nota normal",
		id: "9",
		archived: false,
		directoryId: null,
	},
	{
		name: "Nota excluida 2",
		id: "129",
		archived: true,
		directoryId: null,
	},
];

export const dirs: DirectoryDataType[] = [
	{
		name: "Java",
		id: 1,
		parentId: null,
		childrens: [
			{
				name: "Spring",
				id: 191,
				parentId: 9999,
				childrens: null,
				notes: [
					{
						name: "Spring security",
						id: "199",
						archived: false,
						directoryId: 1,
					},
				],
			},
			{
				name: "Spring",
				id: 192,
				parentId: 10000,
				childrens: null,
				notes: [
					{
						name: "Spring security",
						id: "777",
						archived: false,
						directoryId: 1,
					},
				],
			},
			{
				name: "Spring",
				id: 193,
				parentId: 190190,
				childrens: null,
				notes: [
					{
						name: "Spring security",
						id: "222",
						archived: false,
						directoryId: 1,
					},
				],
			},
			{
				name: "Spring",
				id: 194,
				parentId: 121,
				childrens: [
					{
						name: "Spring",
						id: 1900000,
						parentId: 121,
						childrens: null,
						notes: [
							{
								name: "Spring security",
								id: "455454",
								archived: false,
								directoryId: 1900000,
							},
						],
					},
				],
				notes: [
					{
						name: "Spring security",
						id: "455454",
						archived: false,
						directoryId: 194,
					},
				],
			},
		],
		notes: [
			{
				name: "Nota excluida 2",
				id: "2",
				archived: false,
				directoryId: 1213,
			},
			{
				name: "Nota excluida 2",
				id: "3",
				archived: false,
				directoryId: 4667,
			},
		],
	},

	{
		name: "JavaScript",
		id: 2,
		parentId: null,
		childrens: [],
		notes: [
			{
				name: "Nota excluida 2",
				id: "5",
				archived: false,
				directoryId: 99898,
			},
			{
				name: "Nota excluida 2",
				id: "10",
				archived: false,
				directoryId: 87776762,
			},
		],
	},
];

export const tags = [
	{ id: 1, name: "JavaScript", colorHex: "#f7df1e" },
	{ id: 2, name: "Python", colorHex: "#3572A5" },
	{ id: 3, name: "Java", colorHex: "#b07219" },
	{ id: 4, name: "C++", colorHex: "#00599C" },
	{ id: 5, name: "Go", colorHex: "#00ADD8" },
	{ id: 6, name: "Rust", colorHex: "#DEA584" },
	{ id: 7, name: "TypeScript", colorHex: "#3178c6" },
	{ id: 8, name: "Kotlin", colorHex: "#A97BFF" },
	{ id: 9, name: "Ruby", colorHex: "#CC342D" },
	{ id: 10, name: "Swift", colorHex: "#FFAC45" },
];