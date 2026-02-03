"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getPrimaryGradient } from "@/config/app.config";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void | Promise<void>;
    confirmText?: string;
    cancelText?: string;
    variant?: "destructive" | "default";
    isLoading?: boolean;
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "default",
    isLoading = false,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl max-w-sm">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <DialogDescription className="text-muted-foreground">{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl w-full sm:w-auto" disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        className="rounded-xl text-white shadow-lg w-full sm:w-auto"
                        variant={variant}
                        style={variant === 'default' ? { background: getPrimaryGradient() } : undefined}
                        disabled={isLoading}
                    >
                        {isLoading ? "Procesando..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
