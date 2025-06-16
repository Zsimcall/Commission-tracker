const { useState, useEffect } = React;

function CommissionDashboard() {
  const [summary, setSummary] = useState({
    total_commission: 0,
    total_lines: 0,
    average_commission_per_line: 0
  });
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch('/summary')
      .then(res => res.json())
      .then(data => setSummary(data));

    fetch('/lines')
      .then(res => res.json())
      .then(data => setLines(data));
  }, []);

  const filtered = lines.filter(
    line => line.phone_number && line.phone_number.includes(search)
  );

  return (
    React.createElement('div', { className: 'dashboard' },
      React.createElement('h1', null, 'Commission Tracker'),
      React.createElement('div', { className: 'summary' },
        React.createElement('div', null, `Total Commission: $${summary.total_commission}`),
        React.createElement('div', null, `Total Lines: ${summary.total_lines}`),
        React.createElement('div', null, `Average per Line: $${summary.average_commission_per_line}`)
      ),
      React.createElement('div', { className: 'search' },
        React.createElement('input', {
          placeholder: 'Search phone number',
          value: search,
          onChange: e => setSearch(e.target.value)
        })
      ),
      React.createElement('table', { className: 'lines' },
        React.createElement('thead', null,
          React.createElement('tr', null,
            ['Phone', 'Customer', 'Carrier', 'Activation Date', 'Plan', 'Total Commission']
              .map(h => React.createElement('th', { key: h }, h))
          )
        ),
        React.createElement('tbody', null,
          filtered.map((line, i) =>
            React.createElement('tr', { key: i },
              React.createElement('td', null, line.phone_number),
              React.createElement('td', null, line.customer),
              React.createElement('td', null, line.carrier),
              React.createElement('td', null, line.activation_date),
              React.createElement('td', null, line.line_description),
              React.createElement('td', null, `$${line.total_commission}`)
            )
          )
        )
      )
    )
  );
}

function App() {
  return React.createElement(CommissionDashboard);
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App));
