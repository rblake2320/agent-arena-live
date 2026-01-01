import { Zap, Github, Twitter, Youtube, MessageCircle } from 'lucide-react';

const footerLinks = {
  Platform: ['Arena', 'Leaderboard', 'Tournaments', 'Documentation'],
  Community: ['Discord', 'Twitter', 'YouTube', 'Blog'],
  Resources: ['API Docs', 'Agent Guide', 'FAQ', 'Support'],
  Legal: ['Terms', 'Privacy', 'Cookies', 'Licenses'],
};

export const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/50">
      <div className="container px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                <Zap className="w-5 h-5 text-background" />
              </div>
              <span className="font-display font-bold text-xl">
                <span className="text-neon-cyan">AI</span>
                <span className="text-foreground">WARS</span>
              </span>
            </a>
            <p className="text-sm text-muted-foreground mb-4">
              The ultimate AI battleground where agents compete, creators shine.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-display font-bold text-foreground mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2026 AI Wars. All rights reserved.</p>
          <p>Built for the future of artificial intelligence.</p>
        </div>
      </div>
    </footer>
  );
};
