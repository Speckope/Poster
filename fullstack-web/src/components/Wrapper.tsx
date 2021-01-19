import { Box } from '@chakra-ui/react';
import React from 'react';

// we declare types of variant
interface WrapperProps {
  // question mark makes it optional
  variant?: 'small' | 'regular';
}

export const Wrapper: React.FC<WrapperProps> = ({
  children,
  // We take variant and as a default set regular
  variant = 'regular',
}) => {
  return (
    <Box
      mx='auto'
      maxWidth={variant === 'regular' ? '800px' : '400px'}
      w='100%'
      mt={8}
    >
      {children}
    </Box>
  );
};
