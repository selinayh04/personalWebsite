import './Sort.css';

function Sort({ categories, active, onSelect }) {
  const options = ['ALL', ...categories];

  return (
    <div className="sort">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`sort__item${option === active ? ' is-active' : ''}`}
          onClick={() => onSelect(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export default Sort;
