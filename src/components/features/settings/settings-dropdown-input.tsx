import React, { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { cn } from "#/utils/utils";
import { OptionalTag } from "./optional-tag";

interface SettingsDropdownInputProps {
  testId: string;
  name: string;
  items: { key: React.Key; label: string }[];
  label?: ReactNode;
  wrapperClassName?: string;
  placeholder?: string;
  showOptionalTag?: boolean;
  isDisabled?: boolean;
  isLoading?: boolean;
  defaultSelectedKey?: string;
  selectedKey?: string;
  isClearable?: boolean;
  allowsCustomValue?: boolean;
  required?: boolean;
  onSelectionChange?: (key: React.Key | null) => void;
  onInputChange?: (value: string) => void;
  defaultFilter?: (textValue: string, inputValue: string) => boolean;
  startContent?: ReactNode;
  inputWrapperClassName?: string;
  inputClassName?: string;
}

export function SettingsDropdownInput({
  testId,
  label,
  wrapperClassName,
  name,
  items,
  placeholder,
  showOptionalTag,
  isDisabled,
  isLoading,
  defaultSelectedKey,
  selectedKey,
  allowsCustomValue,
  required,
  onSelectionChange,
  onInputChange,
  defaultFilter,
  startContent,
  inputWrapperClassName,
  inputClassName,
}: SettingsDropdownInputProps) {
  const { t } = useTranslation();
  const rootRef = useClickOutsideElement<HTMLLabelElement>(() => setIsOpen(false));
  const [isOpen, setIsOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  const currentSelectedKey = selectedKey ?? defaultSelectedKey;

  React.useEffect(() => {
    const selectedItem = items.find(
      (item) => item.key.toString() === currentSelectedKey,
    );

    if (selectedItem) {
      setInputValue(selectedItem.label);
      return;
    }

    if (allowsCustomValue && currentSelectedKey) {
      setInputValue(currentSelectedKey);
      return;
    }

    setInputValue("");
  }, [allowsCustomValue, currentSelectedKey, items]);

  const filteredItems = React.useMemo(() => {
    if (!inputValue) {
      return items;
    }

    return items.filter((item) =>
      defaultFilter
        ? defaultFilter(item.label, inputValue)
        : item.label.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [defaultFilter, inputValue, items]);

  const handleSelect = (item: { key: React.Key; label: string }) => {
    setInputValue(item.label);
    setIsOpen(false);
    onInputChange?.(item.label);
    onSelectionChange?.(item.key);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setIsOpen(true);
    onInputChange?.(value);

    if (!value) {
      onSelectionChange?.(null);
      return;
    }

    const exactMatch = items.find((item) => item.label === value);
    if (exactMatch) {
      onSelectionChange?.(exactMatch.key);
    }
  };

  return (
    <label className={cn("flex flex-col gap-2.5", wrapperClassName)} ref={rootRef}>
      {label && (
        <div className="flex items-center gap-1">
          <span className="text-sm">{label}</span>
          {showOptionalTag && <OptionalTag />}
        </div>
      )}

      <div className="relative w-full">
        <div
          className={cn(
            "flex items-center gap-2 bg-tertiary border border-[#717888] h-10 w-full max-w-[680px] rounded-sm px-2",
            {
              "opacity-60 cursor-not-allowed": isDisabled || isLoading,
            },
            inputWrapperClassName,
          )}
        >
          {startContent}
          <input
            aria-label={typeof label === "string" ? label : name}
            className={cn(
              "bg-transparent border-0 outline-none w-full placeholder:italic",
              inputClassName,
            )}
            data-testid={testId}
            disabled={isDisabled || isLoading}
            name={name}
            onChange={(event) => handleInputChange(event.target.value)}
            onClick={() => setIsOpen(true)}
            onFocus={() => setIsOpen(true)}
            placeholder={isLoading ? t("HOME$LOADING") : placeholder}
            required={required}
            value={inputValue}
          />
          <button
            aria-label={`${name}-toggle`}
            className="text-xs text-white/70"
            disabled={isDisabled || isLoading}
            onClick={(event) => {
              event.preventDefault();
              setIsOpen((open) => !open);
            }}
            type="button"
          >
            ▾
          </button>
        </div>

        {isOpen && filteredItems.length > 0 && !(isDisabled || isLoading) && (
          <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-[#717888] bg-tertiary p-1 shadow-lg">
            {filteredItems.map((item) => (
              <li key={item.key.toString()}>
                <button
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-[#717888]"
                  onClick={() => handleSelect(item)}
                  onMouseDown={(event) => event.preventDefault()}
                  type="button"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </label>
  );
}
