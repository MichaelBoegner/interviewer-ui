export const AsciiHeader = ({ text }) => {
  return (
    <pre
      className="text-green-500 text-sm mx-auto block"
      style={{
        fontFamily: "'Fira Code', 'Courier New', monospace",
        fontSize: "0.7rem",
        lineHeight: 1.2,
        whiteSpace: "pre",
        letterSpacing: 0,
        textAlign: "center",
        margin: 0,
        padding: 0,
        width: "100%",
        fontWeight: "bold",
        fontVariantLigatures: "none",
      }}
    >{`
  ___ _   _ _____ _____ ______     _____ _______        _______ ____  
 |_ _| \\ | |_   _| ____|  _ \\ \\   / /_ _| ____\\ \\      / / ____|  _ \\ 
  | ||  \\| | | | |  _| | |_) \\ \\ / / | ||  _|  \\ \\ /\\ / /|  _| | |_) |
  | || |\\  | | | | |___|  _ < \\ V /  | || |___  \\ V  V / | |___|  _ < 
 |___|_| \\_| |_| |_____|_| \\_\\ \\_/  |___|_____|  \\_/\\_/  |_____|_| \\_\\
                                                                       
${">>"} ${text}
`}</pre>
  );
};
