import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog'; // Adjust the import path as needed
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ColourDialogProps {
    onSubmit: (color: string) => void;
    onClose: () => void;
    isDialogOpen: boolean;
}

const ColourDialog: React.FC<ColourDialogProps> = ({ onSubmit, onClose, isDialogOpen }) => {
    const [colorInput, setColorInput] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        console.log(colorInput)
        onSubmit(colorInput.toUpperCase());
        setColorInput('');
        onClose();
    };
    console.log(isDialogOpen)

    return (
        <Dialog open={isDialogOpen} onOpenChange={(open) => { if (open == false) { onClose() } }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Card colour</DialogTitle>
                    <DialogDescription>Choose a colour for the card</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-rows-2 grid-cols-4 items-center gap-4 justify-items-center">
                            <Label htmlFor="color" className="text-right col-span-4 row-start-1 row-end-1s">
                                Enter first letter of new color (r/g/b/y)
                            </Label>
                            <Input
                                id="color"
                                className="col-span-4 row-start-2"
                                placeholder="r"
                                value={colorInput}
                                onChange={(e) => setColorInput(e.target.value)}
                                maxLength={1}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Submit</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ColourDialog;
