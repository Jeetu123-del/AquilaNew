import React                                    from 'react';
import Link                                     from 'next/link';
import dynamic                                  from 'next/dynamic';
import parse, { attributesToProps, domToReact } from 'html-react-parser';
import useTranslation                           from 'next-translate/useTranslation';
import { getBlockCMS }                          from '@aquilacms/aquila-connector/api/blockcms';
//import Accordion                                from '@components/common/Accordion';
//import AccountMenu                              from '@components/account/AccountMenu';
//import BlockSlider                              from '@components/common/BlockSlider';
//import BlogList                                 from '@components/common/BlogList';
import Contact from '@components/common/Contact';
//import Gallery                                  from '@components/common/Gallery';
import Newsletter from '@components/common/Newsletter';
//import ProductCard                              from '@components/product/ProductCard';
//import ProductList                              from '@components/product/ProductList';
//import Slider                                   from '@components/common/Slider';
//import { getAqModules } from '@lib/utils';

export default async function BlockCMS({ nsCode, content = '', displayerror = false, recursion = 0 }) {
    const { lang } = useTranslation();
    
    let html = '';
    if (content) {
        // Live use in code (data in "content" prop)
        html = content;
    } else {
        const res = await getBlockCMS(nsCode, lang);
        if (res?.content) {
            html = res.content;
        }
    }

    //const aqModules = getAqModules();

    // Next Sourcia components array
    const nsComponents = {
        //'ns-accordion'        : <Accordion />,
        //'ns-account-menu'     : <AccountMenu />,
        //'ns-block-slider'     : <BlockSlider />,
        //'ns-blog-articles'    : <BlogList />,
        'ns-contact'   : <Contact />,
        //'ns-gallery'          : <Gallery />,
        'ns-newsletter': <Newsletter />,
        //'ns-product-card'     : <ProductCard col="12" />,
        //'ns-product-card-list': <ProductList />,
        //'ns-slider'           : <Slider />,
    };

    const options = {
        replace: ({ type, name, attribs, children }) => {
            // Replace <ns-[...]> by React Next Sourcia component
            if (type === 'tag' && name && nsComponents[name]) {
                const component = React.cloneElement(
                    nsComponents[name],
                    {
                        ...attribs,
                        children: domToReact(children, options)
                    }
                );
                return component;
            }

            // Replace <aq-[...]> by Aquila Module
            /*if (type === 'tag' && name && aqModules?.find((comp) => comp.code === name)) {
                const AqModule  = dynamic(() => aqModules.find((comp) => comp.code === name).jsx);
                const component = React.cloneElement(
                    <AqModule />,
                    {
                        ...attribs
                    }
                );
                return component;
            }*/

            // Replace <ns-cms> by <BlockCMS>
            if (name === 'ns-cms') {
                if (!attribs['ns-code']) {
                    return;
                }
                
                // IMPORTANT : Detection of infinite loops in the CMS block
                if (nsCode === attribs['ns-code']) {
                    console.error(`Infinite loop detected in CMS block "${attribs['ns-code']}" !\nCheck the content of this CMS block !`);
                    return;
                }
                // IMPORTANT : Recursion limit to avoid infinite loops (fixed at 10)
                if (recursion > 10) {
                    console.error(`Recursion limit reached on CMS block "${attribs['ns-code']}" !\nCheck the content of this CMS block !`);
                    return;
                }

                return <BlockCMS nsCode={attribs['ns-code']} recursion={recursion + 1} />;
            }

            // Replace <a> by Next link (if not an external link)
            if (type === 'tag' && name === 'a') {
                // if no href => home page
                if (!attribs.href) {
                    attribs.href = '/';
                }
                if (attribs.href.startsWith('/') && !attribs.href.match(/\.[a-z0-9]{1,}$/i)) {
                    return <Link href={attribs.href} prefetch={false} {...attributesToProps(attribs)}>
                        {domToReact(children, options)}
                    </Link>;
                }
            }
        }
    };

    if (html) {
        return <>{parse(html, options)}</>;
    } else if (displayerror) {
        return (
            <div>No BlockCMS for ns-code &apos;{nsCode}&apos;</div>
        );
    } else {
        return null;
    }
}
