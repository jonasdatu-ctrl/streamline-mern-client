// src/components/common/Button.js
/**
 * Reusable Button Component
 *
 * A flexible button component with built-in styling and accessibility features.
 * Supports different variants, sizes, and states.
 */

import React from 'react';
import PropTypes from 'prop-types';

/**
 * Button component with customizable styles and behavior
 * @param {Object} props - Component props
 * @param {string} props.children - Button content (text or elements)
 * @param {string} props.variant - Button style variant ('primary', 'secondary', 'danger')
 * @param {string} props.size - Button size ('sm', 'md', 'lg')
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {function} props.onClick - Click handler function
 * @param {string} props.type - Button type ('button', 'submit', 'reset')
 * @param {string} props.className - Additional CSS classes
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  // Base styles
  const baseStyles = 'font-bold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200';

  // Variant styles
  const variants = {
    primary: 'bg-blue-500 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-500 hover:bg-gray-700 text-white focus:ring-gray-500',
    danger: 'bg-red-500 hover:bg-red-700 text-white focus:ring-red-500',
  };

  // Size styles
  const sizes = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };

  // Disabled styles
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  // Combine all styles
  const buttonStyles = `${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`;

  return (
    <button
      type={type}
      className={buttonStyles}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Prop types for type checking and documentation
Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
};

export default Button;