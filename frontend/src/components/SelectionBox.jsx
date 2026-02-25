export default function SelectionBox({ question, options, selectedIds, handleToggle, isMulti = false }) {
    return (
        <div className="flex flex-col gap-1 py-2">
          <h3 className="p-1 font-medium text-slate-700"> {question}</h3>
          {options.map(s => {
              // LOGIC: If multi, check if ID is in array. If single, check if ID matches exactly.
              const isSelected = isMulti 
                  ? selectedIds.includes(s.id) 
                  : selectedIds === s.id;

              return (
                  <SelectionOption 
                      key={s.id}
                      title={s.title}
                      isSelected={isSelected}
                      isMulti={isMulti} // Pass this down to control the shape
                      onToggle={() => handleToggle(s.id)}
                  />
              );
          })}
        </div>
    )
}

export function SelectionOption({ title, isSelected, onToggle, isMulti }) {
  return (
    <label 
      onClick={onToggle}
      className={`flex items-center gap-2 p-1 px-1.5 rounded-xl cursor-pointer transition-all border-2 w-full
        ${isSelected ? 'bg-teal-50 border-teal-500' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
    >
      {/* Dynamic Icon Shape: Circle for Single, Rounded Square for Multi */}
      <div className={`w-4 h-4 flex items-center justify-center border-2 transition-colors
        ${isMulti ? 'rounded' : 'rounded-full'} 
        ${isSelected ? 'bg-teal-600 border-teal-600' : 'bg-white border-gray-300'}`}>
        
        {isSelected && (
          isMulti ? (
            // Checkmark for Multi
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            // Small white dot for Single (Radio style)
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          )
        )}
      </div>

      <div>
        <h3 className="font-normal text-slate-900 text-sm">{title}</h3>
      </div>
    </label>
  );
}