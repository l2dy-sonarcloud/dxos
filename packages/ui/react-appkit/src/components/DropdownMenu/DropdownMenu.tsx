//
// Copyright 2023 DXOS.org
//
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import {
  DropdownMenuCheckboxItemProps,
  DropdownMenuItemProps,
  DropdownMenuSubContentProps
} from '@radix-ui/react-dropdown-menu';
import React, { ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';

import { useThemeContext } from '@dxos/aurora';
import { mx } from '@dxos/aurora-theme';

export interface DropdownMenuSlots {
  root?: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Root>;
  trigger?: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Trigger>;
  content?: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>;
}

export interface DropdownMenuProps {
  trigger?: ReactNode;
  children?: ReactNode;
  slots?: DropdownMenuSlots;
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ className, ...props }: DropdownMenuItemProps, forwardedRef) => {
    const { tx } = useThemeContext();
    return (
      <DropdownMenuPrimitive.Item
        ref={forwardedRef}
        {...props}
        className={tx('dropdownMenu.item', 'dropdownMenu__item', {}, className)}
      />
    );
  }
);

export const DropdownMenuSeparator = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>) => {
  return (
    <DropdownMenuPrimitive.Separator
      {...props}
      className={mx('my-1 h-px bg-neutral-200 dark:bg-neutral-700', className)}
    />
  );
};

export const DropdownMenuLabel = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>) => {
  return (
    <DropdownMenuPrimitive.Label
      {...props}
      className={mx('select-none px-2 py-2 text-sm text-neutral-900 dark:text-neutral-100', className)}
    />
  );
};

export const DropdownMenuCheckboxItem = forwardRef<HTMLDivElement, DropdownMenuCheckboxItemProps>(
  ({ className, ...props }: DropdownMenuCheckboxItemProps, forwardedRef) => {
    const { tx } = useThemeContext();
    return (
      <DropdownMenuPrimitive.CheckboxItem
        ref={forwardedRef}
        {...props}
        className={tx('dropdownMenu.item', 'dropdownMenu__item--checkbox', {}, className)}
      />
    );
  }
);

export const DropdownMenuSubTrigger = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger>) => {
  const { tx } = useThemeContext();
  return (
    <DropdownMenuPrimitive.SubTrigger
      {...props}
      className={tx('dropdownMenu.item', 'dropdownMenu__item--sub-trigger', {}, className)}
    />
  );
};

export const DropdownMenuSubContent = forwardRef<HTMLDivElement, DropdownMenuSubContentProps>(
  ({ className, ...props }: DropdownMenuSubContentProps, forwardedRef) => {
    return (
      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.SubContent
          ref={forwardedRef}
          {...props}
          className={mx(
            'origin-radix-dropdown-menu radix-side-right:animate-scale-in',
            'w-full rounded-md px-1 py-1 text-sm shadow-md',
            'bg-white dark:bg-neutral-800',
            className
          )}
        />
      </DropdownMenuPrimitive.Portal>
    );
  }
);

export const DropdownMenuItemIndicator = DropdownMenuPrimitive.ItemIndicator;

export const DropdownMenuSub = DropdownMenuPrimitive.Sub;

export const DropdownMenu = ({ trigger, children, slots = {} }: DropdownMenuProps) => {
  return (
    <DropdownMenuPrimitive.Root {...slots.root}>
      <DropdownMenuPrimitive.Trigger asChild {...slots.trigger}>
        {trigger}
      </DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          align='end'
          sideOffset={4}
          {...slots.content}
          className={mx(
            'radix-side-top:animate-slide-up radix-side-bottom:animate-slide-down',
            'w-48 rounded-lg p-1 shadow-md md:w-56',
            'bg-white dark:bg-neutral-800',
            slots.content?.className
          )}
        >
          {children}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
};