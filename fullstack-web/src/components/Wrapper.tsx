import { Box } from '@chakra-ui/react';
import React from 'react';

// WE create this so we dry in Layout.
// Also we know type of variant in wrapper from looking up this components code
export type WrapperVariant = 'small' | 'regular';
// we declare types of variant
interface WrapperProps {
  // question mark makes it optional
  variant?: WrapperVariant;
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
