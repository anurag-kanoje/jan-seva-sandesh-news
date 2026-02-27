import { useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 px-6">
        <h1 className="text-7xl font-heading font-bold text-primary">404</h1>
        <p className="text-xl text-muted-foreground">यह पेज उपलब्ध नहीं है</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          आप जिस पेज की तलाश कर रहे हैं वह मौजूद नहीं है या हटा दिया गया है।
        </p>
        <a href="/" className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors">
          होम पेज पर वापस जाएं
        </a>
      </div>
    </div>
  );
};

export default NotFound;
