import React from 'react';
import { 
  Wrench, 
  Zap, 
  Snowflake, 
  Hammer, 
  Layers, 
  Paintbrush, 
  Tv, 
  Sparkles, 
  Flower2, 
  Home, 
  HelpCircle,
  LucideProps
} from 'lucide-react';

interface Props extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<Props> = ({ name, ...props }) => {
  switch (name.toLowerCase()) {
    case 'wrench':
    case 'cat-plumbing':
    case 'plumbing':
      return <Wrench {...props} />;
    case 'zap':
    case 'cat-electrical':
    case 'electrical':
      return <Zap {...props} />;
    case 'snowflake':
    case 'cat-ac':
    case 'ac & refrigeration':
    case 'ac':
      return <Snowflake {...props} />;
    case 'hammer':
    case 'cat-carpentry':
    case 'carpentry':
      return <Hammer {...props} />;
    case 'layers':
    case 'cat-masonry':
    case 'masonry':
      return <Layers {...props} />;
    case 'paintbrush':
    case 'cat-painting':
    case 'painting':
      return <Paintbrush {...props} />;
    case 'tv':
    case 'cat-appliance':
    case 'appliance repair':
      return <Tv {...props} />;
    case 'sparkles':
    case 'cat-cleaning':
    case 'cleaning':
      return <Sparkles {...props} />;
    case 'flower2':
    case 'cat-gardening':
    case 'gardening':
    case 'gardening & landscaping':
      return <Flower2 {...props} />;
    default:
      return <Home {...props} />;
  }
};