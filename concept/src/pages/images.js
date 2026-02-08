import React from 'react';
import { Container, Section } from '../components/style';
import Layout from '../components/common/layout/layout';
import "./gallery.css"
import SEO from '../components/common/SEO';
import seoConfig from '../seo/seoConfig';
import { createBreadcrumbSchema } from '../seo/schemas';
import i1 from "../images/i1.webp"
import i2 from "../images/i2.webp"
import i3 from "../images/i3.webp"
import i4 from "../images/i4.webp"
import i5 from "../images/i5.webp"
import i6 from "../images/i6.webp"
import i7 from "../images/i7.webp"
// import i8 from "../images/i8.webp"
import i9 from "../images/i9.webp"
import i10 from "../images/i10.webp"
import i11 from "../images/i11.webp"
import i12 from "../images/i12.webp"
import i13 from "../images/i13.webp"
import Navigation from '../components/common/navigation/navigation';
import Form from '../components/common/contact-form';
import Footer from '../components/common/footer';

const Images= () =>  {
  return (
   <Layout>
    <SEO {...seoConfig.images} schemaMarkup={createBreadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Gallery', path: '/images' }])} />
	<Navigation/>
   <main>
   <Section style={{background:'darkseagreen'}}>
    <Container>
 <h1 style={{ textAlign: 'center', fontSize: '28px', color: '#005B38', marginBottom: '8px' }}>Concept Classes Photo Gallery</h1>
 <h2>सफ़लता के तीन सूत्र होते हैं, महेनत, कड़ी महेनत, और जादा कड़ी महेनत</h2>
<div id="gallery" class="container-fluid">
  <img src={i1} class="img-responsive"  alt="Concept Classes campus building in Bikaner" />
  <img src={i2} class="img-responsive"  alt="Students in lecture hall at Concept Classes" />
  <img src={i4} class="img-responsive" alt="Concept Classes classroom with students" />

   <img src={i3} class="img-responsive" alt="Science laboratory at Concept Classes" />

  <img src={i5} class="img-responsive" alt="Student awards ceremony at Concept Classes" />
<img src={i6} class="img-responsive" alt="Concept Classes library and study area" />
  <img src={i7} class="card img-responsive" alt="Faculty and staff at Concept Classes" />
  {/* <img src={i8} class="img-responsive" alt="concept" /> */}
  <img src={i9} class="img-responsive" alt="Student group activities and events" />
  <img src={i10} class="img-responsive" alt="Concept Classes seminar and workshop" />
  <img src={i11} class="img-responsive" alt="Students celebrating results at Concept Classes" />
  <img src={i13} class="img-responsive" alt="Concept Classes sports and extracurricular activities" />
  <img src={i12} class="img-responsive" alt="Annual function at Concept Classes Bikaner" />

  

</div>

<div id="myModal" class="modal fade" role="dialog">
  <div class="modal-dialog">

    <div class="modal-content">
      <div class="modal-body">
      </div>
    </div>

  </div>
</div>
<div id="contactus">
   <Form/>
   </div>
    </Container>
   </Section>
   </main>
   <Footer/>
   </Layout> 
  );
}

export default Images;
