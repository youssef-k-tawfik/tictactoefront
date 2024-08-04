export default function Square({ value, onClick, i }) {
  return (
    <div className="size-20 bg-blue-700 border border-black">
      <button className="w-full h-full text-7xl cell" onClick={() => onClick(i)}>
        {value}
      </button>
    </div>
  );
}
