function PasswordRequirements({ validation }) {
  const requirements = [
    { key: "length", label: "At least 8 characters" },
    { key: "uppercase", label: "One uppercase letter" },
    { key: "lowercase", label: "One lowercase letter" },
    { key: "number", label: "One number" },
    { key: "symbol", label: "One special character" },
  ];

  const allMet = Object.values(validation).every(Boolean);

  if (allMet) {
    return (
      <p className="password-secure">
        Your password is valid!
      </p>
    );
  }

  return (
    <div className="password-requirements">
      {requirements.map((item) => (
        <div
          key={item.key}
          className={`requirement ${
            validation[item.key] ? "valid" : ""
          }`}
        >
          <span>{validation[item.key] ? "✓" : "○"}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default PasswordRequirements;