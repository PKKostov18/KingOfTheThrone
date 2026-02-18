// Bristol Stool Scale — scientific classification 💩
// https://en.wikipedia.org/wiki/Bristol_stool_scale

export interface BristolType {
  type: number;
  emoji: string;
  name: string;
  description: string;
}

export const BRISTOL_SCALE: BristolType[] = [
  {
    type: 1,
    emoji: '🪨',
    name: 'Type 1',
    description: 'Hard lumps (like nuts)',
  },
  {
    type: 2,
    emoji: '🌰',
    name: 'Type 2',
    description: 'Sausage-shaped but lumpy',
  },
  {
    type: 3,
    emoji: '🌭',
    name: 'Type 3',
    description: 'Sausage-shaped with cracks',
  },
  {
    type: 4,
    emoji: '🐍',
    name: 'Type 4',
    description: 'Smooth and soft (perfect!)',
  },
  {
    type: 5,
    emoji: '☁️',
    name: 'Type 5',
    description: 'Soft blobs with clear edges',
  },
  {
    type: 6,
    emoji: '🫠',
    name: 'Type 6',
    description: 'Fluffy pieces, mushy',
  },
  {
    type: 7,
    emoji: '💧',
    name: 'Type 7',
    description: 'Entirely liquid (watery)',
  },
];

export const FUN_RATINGS = [
  { value: 1, emoji: '😫', label: 'Terrible' },
  { value: 2, emoji: '😕', label: 'Not great' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😊', label: 'Nice' },
  { value: 5, emoji: '🤩', label: 'Royal!' },
];
