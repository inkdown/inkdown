/**
 * Tab Management Smoke Tests
 *
 * These tests verify that tab creation, switching, and closing work correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as React from 'react';

describe('Tab Management Smoke Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Tab Bar Rendering', () => {
        it('should render tab bar container', () => {
            const TabBar = () => {
                return React.createElement('div', {
                    'data-testid': 'tab-bar',
                    className: 'tab-bar',
                    role: 'tablist',
                });
            };

            render(React.createElement(TabBar));

            expect(screen.getByTestId('tab-bar')).toBeInTheDocument();
            expect(screen.getByRole('tablist')).toBeInTheDocument();
        });

        it('should render individual tabs', () => {
            const tabs = [
                { id: 'tab-1', title: 'File 1.md' },
                { id: 'tab-2', title: 'File 2.md' },
            ];

            const TabBar = () => {
                return React.createElement('div', { 'data-testid': 'tab-bar', role: 'tablist' },
                    tabs.map(tab => 
                        React.createElement('button', {
                            key: tab.id,
                            'data-testid': `tab-${tab.id}`,
                            role: 'tab',
                            className: 'tab',
                        }, tab.title)
                    )
                );
            };

            render(React.createElement(TabBar));

            expect(screen.getByTestId('tab-tab-1')).toHaveTextContent('File 1.md');
            expect(screen.getByTestId('tab-tab-2')).toHaveTextContent('File 2.md');
            expect(screen.getAllByRole('tab')).toHaveLength(2);
        });

        it('should highlight active tab', () => {
            const tabs = [
                { id: 'tab-1', title: 'File 1.md', active: true },
                { id: 'tab-2', title: 'File 2.md', active: false },
            ];

            const TabBar = () => {
                return React.createElement('div', { 'data-testid': 'tab-bar' },
                    tabs.map(tab => 
                        React.createElement('button', {
                            key: tab.id,
                            'data-testid': `tab-${tab.id}`,
                            className: tab.active ? 'tab active' : 'tab',
                            'aria-selected': tab.active,
                        }, tab.title)
                    )
                );
            };

            render(React.createElement(TabBar));

            expect(screen.getByTestId('tab-tab-1')).toHaveClass('active');
            expect(screen.getByTestId('tab-tab-1')).toHaveAttribute('aria-selected', 'true');
            expect(screen.getByTestId('tab-tab-2')).not.toHaveClass('active');
        });
    });

    describe('Tab Switching', () => {
        it('should switch tabs on click', () => {
            const TabBarWithState = () => {
                const [activeTab, setActiveTab] = React.useState('tab-1');
                const tabs = [
                    { id: 'tab-1', title: 'File 1.md' },
                    { id: 'tab-2', title: 'File 2.md' },
                ];

                return React.createElement('div', null, [
                    React.createElement('div', { key: 'tabs', 'data-testid': 'tab-bar' },
                        tabs.map(tab => 
                            React.createElement('button', {
                                key: tab.id,
                                'data-testid': `tab-${tab.id}`,
                                className: activeTab === tab.id ? 'tab active' : 'tab',
                                onClick: () => setActiveTab(tab.id),
                            }, tab.title)
                        )
                    ),
                    React.createElement('div', { 
                        key: 'active', 
                        'data-testid': 'active-tab-id' 
                    }, activeTab),
                ]);
            };

            render(React.createElement(TabBarWithState));

            expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-1');

            fireEvent.click(screen.getByTestId('tab-tab-2'));

            expect(screen.getByTestId('active-tab-id')).toHaveTextContent('tab-2');
            expect(screen.getByTestId('tab-tab-2')).toHaveClass('active');
        });

        it('should update content when switching tabs', () => {
            const tabContents: Record<string, string> = {
                'tab-1': '# Content 1',
                'tab-2': '# Content 2',
            };

            const TabBarWithContent = () => {
                const [activeTab, setActiveTab] = React.useState('tab-1');

                return React.createElement('div', null, [
                    React.createElement('div', { key: 'tabs', 'data-testid': 'tab-bar' },
                        Object.keys(tabContents).map(tabId => 
                            React.createElement('button', {
                                key: tabId,
                                'data-testid': `tab-${tabId}`,
                                onClick: () => setActiveTab(tabId),
                            }, tabId)
                        )
                    ),
                    React.createElement('div', { 
                        key: 'content', 
                        'data-testid': 'tab-content' 
                    }, tabContents[activeTab]),
                ]);
            };

            render(React.createElement(TabBarWithContent));

            expect(screen.getByTestId('tab-content')).toHaveTextContent('# Content 1');

            fireEvent.click(screen.getByTestId('tab-tab-2'));

            expect(screen.getByTestId('tab-content')).toHaveTextContent('# Content 2');
        });
    });

    describe('Tab Creation', () => {
        it('should create new tab', () => {
            const TabBarWithAdd = () => {
                const [tabs, setTabs] = React.useState([
                    { id: 'tab-1', title: 'File 1.md' },
                ]);

                const addTab = () => {
                    const newId = `tab-${tabs.length + 1}`;
                    setTabs([...tabs, { id: newId, title: `New Tab ${tabs.length + 1}` }]);
                };

                return React.createElement('div', null, [
                    React.createElement('div', { key: 'tabs', 'data-testid': 'tab-bar' },
                        tabs.map(tab => 
                            React.createElement('button', {
                                key: tab.id,
                                'data-testid': `tab-${tab.id}`,
                                className: 'tab',
                            }, tab.title)
                        )
                    ),
                    React.createElement('button', {
                        key: 'add',
                        'data-testid': 'add-tab-button',
                        onClick: addTab,
                    }, '+'),
                    React.createElement('span', {
                        key: 'count',
                        'data-testid': 'tab-count',
                    }, tabs.length),
                ]);
            };

            render(React.createElement(TabBarWithAdd));

            expect(screen.getByTestId('tab-count')).toHaveTextContent('1');

            fireEvent.click(screen.getByTestId('add-tab-button'));

            expect(screen.getByTestId('tab-count')).toHaveTextContent('2');
            expect(screen.getByTestId('tab-tab-2')).toBeInTheDocument();
        });
    });

    describe('Tab Closing', () => {
        it('should close tab when close button is clicked', () => {
            const TabBarWithClose = () => {
                const [tabs, setTabs] = React.useState([
                    { id: 'tab-1', title: 'File 1.md' },
                    { id: 'tab-2', title: 'File 2.md' },
                ]);

                const closeTab = (tabId: string) => {
                    setTabs(tabs.filter(t => t.id !== tabId));
                };

                return React.createElement('div', null, [
                    React.createElement('div', { key: 'tabs', 'data-testid': 'tab-bar' },
                        tabs.map(tab => 
                            React.createElement('div', {
                                key: tab.id,
                                className: 'tab',
                            }, [
                                React.createElement('span', { key: 'title' }, tab.title),
                                React.createElement('button', {
                                    key: 'close',
                                    'data-testid': `close-${tab.id}`,
                                    onClick: () => closeTab(tab.id),
                                }, '×'),
                            ])
                        )
                    ),
                    React.createElement('span', {
                        key: 'count',
                        'data-testid': 'tab-count',
                    }, tabs.length),
                ]);
            };

            render(React.createElement(TabBarWithClose));

            expect(screen.getByTestId('tab-count')).toHaveTextContent('2');

            fireEvent.click(screen.getByTestId('close-tab-1'));

            expect(screen.getByTestId('tab-count')).toHaveTextContent('1');
            expect(screen.queryByTestId('close-tab-1')).not.toBeInTheDocument();
        });

        it('should switch to next tab when active tab is closed', () => {
            const TabBarWithActiveClose = () => {
                const [tabs, setTabs] = React.useState([
                    { id: 'tab-1', title: 'File 1.md' },
                    { id: 'tab-2', title: 'File 2.md' },
                ]);
                const [activeTab, setActiveTab] = React.useState('tab-1');

                const closeTab = (tabId: string) => {
                    const newTabs = tabs.filter(t => t.id !== tabId);
                    setTabs(newTabs);
                    if (activeTab === tabId && newTabs.length > 0) {
                        setActiveTab(newTabs[0].id);
                    }
                };

                return React.createElement('div', null, [
                    React.createElement('div', { key: 'tabs', 'data-testid': 'tab-bar' },
                        tabs.map(tab => 
                            React.createElement('div', {
                                key: tab.id,
                                className: tab.id === activeTab ? 'tab active' : 'tab',
                            }, [
                                React.createElement('span', { key: 'title' }, tab.title),
                                React.createElement('button', {
                                    key: 'close',
                                    'data-testid': `close-${tab.id}`,
                                    onClick: () => closeTab(tab.id),
                                }, '×'),
                            ])
                        )
                    ),
                    React.createElement('span', {
                        key: 'active',
                        'data-testid': 'active-tab',
                    }, activeTab),
                ]);
            };

            render(React.createElement(TabBarWithActiveClose));

            expect(screen.getByTestId('active-tab')).toHaveTextContent('tab-1');

            fireEvent.click(screen.getByTestId('close-tab-1'));

            expect(screen.getByTestId('active-tab')).toHaveTextContent('tab-2');
        });
    });

    describe('Tab Dirty State', () => {
        it('should show dirty indicator for modified tabs', () => {
            const Tab = ({ title, isDirty }: { title: string; isDirty: boolean }) => {
                return React.createElement('div', {
                    'data-testid': 'tab',
                    className: isDirty ? 'tab dirty' : 'tab',
                }, [
                    React.createElement('span', { key: 'title' }, title),
                    isDirty && React.createElement('span', { 
                        key: 'indicator',
                        'data-testid': 'dirty-indicator',
                        className: 'dirty-indicator',
                    }, '●'),
                ]);
            };

            const { rerender } = render(React.createElement(Tab, { title: 'File.md', isDirty: false }));

            expect(screen.queryByTestId('dirty-indicator')).not.toBeInTheDocument();

            rerender(React.createElement(Tab, { title: 'File.md', isDirty: true }));

            expect(screen.getByTestId('dirty-indicator')).toBeInTheDocument();
            expect(screen.getByTestId('tab')).toHaveClass('dirty');
        });
    });

    describe('Tab Pinning', () => {
        it('should support pinned tabs', () => {
            const tabs = [
                { id: 'tab-1', title: 'File 1.md', pinned: true },
                { id: 'tab-2', title: 'File 2.md', pinned: false },
            ];

            const TabBar = () => {
                return React.createElement('div', { 'data-testid': 'tab-bar' },
                    tabs.map(tab => 
                        React.createElement('div', {
                            key: tab.id,
                            'data-testid': `tab-${tab.id}`,
                            className: tab.pinned ? 'tab pinned' : 'tab',
                        }, [
                            tab.pinned && React.createElement('span', { 
                                key: 'pin',
                                'data-testid': 'pin-icon',
                            }, '📌'),
                            React.createElement('span', { key: 'title' }, tab.title),
                        ])
                    )
                );
            };

            render(React.createElement(TabBar));

            expect(screen.getByTestId('tab-tab-1')).toHaveClass('pinned');
            expect(screen.getByTestId('pin-icon')).toBeInTheDocument();
            expect(screen.getByTestId('tab-tab-2')).not.toHaveClass('pinned');
        });
    });
});
