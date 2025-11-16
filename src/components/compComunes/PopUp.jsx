import React from "react";

export const PopUp = ({isOpen, onClose, title, children}) => {
    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">{title}</h3>
                    <button
                        className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};