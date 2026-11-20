"use client";

import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterProps {
  companies: {
    name: string;
    logo: string;
  }[];
}

export default function Filter({ companies }: FilterProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  const value = (searchParams.get("companies") || "").split(",").filter(Boolean);
  const toggleCompany = (name: string) => {
    const next = value.includes(name) ? value.filter((item) => item !== name) : [...value, name];
    const current = new URLSearchParams(searchParams.toString());
    if (next.length) current.set("companies", next.join(","));
    else current.delete("companies");
    current.delete("page");
    router.push(current.size ? `?${current.toString()}` : "/", { scroll: false });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value.length > 0
            ? `${companies.find((c) => c.name === value[0])
                ?.name} ${
                value.length > 1 ? `and ${value.length - 1} more` : ""
              }`
            : "Select companies..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="flex w-[200px] overflow-hidden p-0" forceMount>
        <Command>
          <CommandInput placeholder="Search companies..." />
          <CommandEmpty>No company found.</CommandEmpty>
          <CommandGroup className="h-full overflow-y-auto">
            {companies.map((company) => (
              <CommandItem
                key={company.name}
                value={company.name}
                onSelect={() => toggleCompany(company.name)}
                className="flex items-center justify-between gap-2"
              >
                {company.name}
                <Check
                  className={cn(
                    "h-4 w-4",
                    value.includes(company.name)
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
